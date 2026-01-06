import type { AvoidanceResult, AvoidZone, Route, RoutePoint } from '@/entities'
import { drawRoutes } from '@/stores/mapStore'
import { calculateRoute } from '@/lib/here-sdk'
import { formatBoundingBox } from '@/utils/geo'
import { getRoutes } from '@/utils/routing/route'
import { findStopSigns } from '@/utils/stoplight'
import { findTrafficAvoidance } from '@/utils/traffic'

//TODO: ADD Via Points to

async function findInitialRoutes(start: RoutePoint, end: RoutePoint) {
  return getRoutes(start, end, {
    transportMode: 'car',
    // alternatives: 3,
    return: ['turnByTurnActions', 'summary', 'polyline'],
  })
}

async function calculateBetterRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  avoid: { areas: AvoidZone[]; segments: string[] },
): Promise<Route[]> {
  const avoidAreas = formatBoundingBox(avoid.areas)

  try {
    const matchResult = await calculateRoute({
      origin,
      destination,
      avoid: {
        areas: avoidAreas,
        segments: avoid.segments,
      },
      transportMode: 'car',
    })

    if (matchResult.routes && matchResult.routes.length > 0) {
      return matchResult.routes
    } else {
      console.warn(`[BetterWay] No routes returned after matching`)
      return []
    }
  } catch (e) {
    console.warn(`[BetterWay] Failed to match better route:`, e)
    return []
  }
}

export const getBetterWayRoutes = async (start: RoutePoint, end: RoutePoint) => {
  const routeInfos = await findInitialRoutes(start, end)
  const improvedRoutes: Route[] = []

  if (routeInfos && routeInfos.length > 0) {
    drawRoutes({ routes: routeInfos.map((routeInfo) => routeInfo.route) })

    // Collect avoidance data from traffic and stop signs (parallel)
    const [trafficResults, stopSignResults] = await Promise.all([
      Promise.all(routeInfos.map((info) => findTrafficAvoidance(info.route))),
      Promise.all(routeInfos.map((info) => findStopSigns(info.route))),
    ])

    // Accumulate all avoid inputs
    const accumulatedAvoid: AvoidanceResult = {
      areas: [],
      segments: [],
    }

    trafficResults.forEach((result) => {
      accumulatedAvoid.segments.push(...result.segments)
    })

    stopSignResults.flat().forEach((result) => {
      accumulatedAvoid.areas.push(result.avoidZone)
    })

    console.log(
      `[BetterWay] Collected avoid data: ${accumulatedAvoid.areas.length} areas, ${accumulatedAvoid.segments.length} segments`,
    )

    const processed = await calculateBetterRoute(start, end, accumulatedAvoid)
    improvedRoutes.push(...processed)
  }

  console.log(`[BetterWay] Returning ${improvedRoutes.length} improved routes`)
  return improvedRoutes
}
