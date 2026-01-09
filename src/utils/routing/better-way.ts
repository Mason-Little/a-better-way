import type { BoundingBox, Route, RoutePoint } from '@/entities'
import { useRoutesStore } from '@/stores/routesStore'
import { calculateRoute } from '@/lib/here-sdk'
import { formatBoundingBox } from '@/utils/geo'
import { getRoutes } from '@/utils/routing/route'
import { findStopSigns } from '@/utils/stoplight'
import { findTrafficAvoidance } from '@/utils/traffic'

async function findInitialRoutes(start: RoutePoint, end: RoutePoint) {
  return getRoutes(start, end, {
    transportMode: 'car',
    routingMode: 'short',
    alternatives: 5,
    return: ['turnByTurnActions', 'summary', 'polyline'],
  })
}

function getRouteDelay(route: Route): number {
  const summary = route.sections[0]?.summary
  if (!summary) return 0
  return summary.duration - (summary.baseDuration ?? summary.duration)
}

function calculateLeastDelayRoute(routes: Route[]): Route | undefined {
  const sorted = [...routes].sort((a, b) => getRouteDelay(a) - getRouteDelay(b))
  return sorted[0]
}

async function calculateBetterRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  avoid: { segments: string[]; stopSignBoxes: BoundingBox[] },
): Promise<Route[]> {
  const formattedStopSignAreas = formatBoundingBox(avoid.stopSignBoxes)

  try {
    const matchResult = await calculateRoute({
      origin,
      destination,
      routingMode: 'short',
      avoid: {
        segments: avoid.segments,
        areas: formattedStopSignAreas,
      },
      alternatives: 5,
      transportMode: 'car',
    })

    if (matchResult.routes?.length) {
      return matchResult.routes
    }
    console.warn('[BetterWay] No routes returned after matching')
    return []
  } catch (e) {
    console.warn('[BetterWay] Failed to match better route:', e)
    return []
  }
}

const MAX_ITERATIONS = 5

export async function getBetterWayRoutes(start: RoutePoint, end: RoutePoint, etaMargin: number) {
  const {
    setRoutes,
    clearAvoidZones,
    clearTrafficCache,
    addAvoidSegments,
    addAvoidStopSignBoxes,
    getCleanedSegments,
    avoidStopSignBoxes,
  } = useRoutesStore()

  // Clear any previous avoid zones and traffic cache
  clearAvoidZones()
  clearTrafficCache()

  const routeInfos = await findInitialRoutes(start, end)

  if (!routeInfos?.length) {
    console.warn('[BetterWay] No initial routes found')
    return
  }

  // Get route with least delay as baseline
  const initialRoutes = routeInfos.map((i) => i.route)
  const bestInitialRoute = calculateLeastDelayRoute(initialRoutes)

  if (!bestInitialRoute) {
    console.warn('[BetterWay] Could not determine best route')
    return
  }

  const baselineDelay = getRouteDelay(bestInitialRoute)
  const baselineEta = bestInitialRoute.sections[0]?.summary.duration ?? 0
  const targetEta = baselineEta + etaMargin
  console.log(
    `[BetterWay] Baseline delay: ${Math.round(baselineDelay / 60)} min, ETA: ${Math.round(baselineEta / 60)} min, target max ETA: ${Math.round(targetEta / 60)} min`,
  )

  // Show the initial routes first
  setRoutes([...initialRoutes])

  let currentRoutes = initialRoutes
  let bestRoute = bestInitialRoute
  let iteration = 0

  while (iteration < MAX_ITERATIONS) {
    iteration++
    console.log(`[BetterWay] Iteration ${iteration}/${MAX_ITERATIONS}`)

    // Analyze current routes for traffic and stop signs
    const [trafficSegments, stopSignResults] = await Promise.all([
      findTrafficAvoidance(currentRoutes),
      findStopSigns(currentRoutes),
    ])

    const newStopSignBoxes = stopSignResults.map((r) => r.avoidZone)

    // Add to store (deduplication handled by store)
    addAvoidSegments(trafficSegments)
    addAvoidStopSignBoxes(newStopSignBoxes)

    // No new avoid zones found, we're done
    if (trafficSegments.length === 0 && newStopSignBoxes.length === 0) {
      console.log('[BetterWay] No new avoid zones found, stopping iteration')
      break
    }

    // Calculate new routes avoiding accumulated zones
    const improvedRoutes = await calculateBetterRoute(start, end, {
      segments: getCleanedSegments(),
      stopSignBoxes: avoidStopSignBoxes.value,
    })

    if (!improvedRoutes.length) {
      console.log('[BetterWay] No improved routes found, keeping current best')
      break
    }

    // Find the route with least delay
    const newBest = calculateLeastDelayRoute(improvedRoutes)
    if (!newBest) {
      console.log('[BetterWay] Could not determine best improved route')
      break
    }

    const newDelay = getRouteDelay(newBest)
    const newEta = newBest.sections[0]?.summary.duration ?? 0
    console.log(
      `[BetterWay] New best - delay: ${Math.round(newDelay / 60)} min, ETA: ${Math.round(newEta / 60)} min`,
    )
    console.log(
      `[BetterWay] Target max ETA: ${Math.round(targetEta / 60)} min, new ETA: ${Math.round(newEta / 60)} min`,
    )

    // Check if ETA is within acceptable margin
    if (newEta > targetEta) {
      console.log('[BetterWay] New route exceeds target ETA, keeping previous best')
      break
    }

    // Update best route and continue iterating
    bestRoute = newBest
    currentRoutes = improvedRoutes

    const hasNewRoutes = setRoutes(improvedRoutes)
    if (!hasNewRoutes) {
      console.log('[BetterWay] All routes were duplicates, stopping iteration')
      break
    }

    // If we got a route with no delay, we're optimal
    const currentDelay = getRouteDelay(bestRoute)
    if (currentDelay <= 0) {
      console.log('[BetterWay] Achieved zero delay route, stopping')
      break
    }
  }

  console.log(
    `[BetterWay] Finished after ${iteration} iterations. Final ETA: ${Math.round((bestRoute.sections[0]?.summary.duration ?? 0) / 60)} min`,
  )
}
