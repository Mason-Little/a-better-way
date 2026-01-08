import type { AvoidZone, Route, RoutePoint } from '@/entities'
import { drawRoutes } from '@/stores/mapStore'
import { calculateRoute } from '@/lib/here-sdk'
import { formatBoundingBox } from '@/utils/geo'
import { getRoutes } from '@/utils/routing/route'
import { findStopSigns } from '@/utils/stoplight'
import { findTrafficAvoidance } from '@/utils/traffic'

async function findInitialRoutes(start: RoutePoint, end: RoutePoint) {
  return getRoutes(start, end, {
    transportMode: 'car',
    return: ['turnByTurnActions', 'summary', 'polyline'],
  })
}

async function calculateBetterRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  avoid: { segments: string[]; stopSignBoxes: AvoidZone[] },
): Promise<Route[]> {
  const formattedStopSignAreas = formatBoundingBox(avoid.stopSignBoxes)

  try {
    const matchResult = await calculateRoute({
      origin,
      destination,
      avoid: {
        segments: avoid.segments,
        areas: formattedStopSignAreas,
      },
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

export async function getBetterWayRoutes(start: RoutePoint, end: RoutePoint) {
  const routeInfos = await findInitialRoutes(start, end)
  const improvedRoutes: Route[] = []

  if (routeInfos?.length) {
    drawRoutes({ routes: routeInfos.map((info) => info.route) })

    const [trafficResults, stopSignResults] = await Promise.all([
      Promise.all(routeInfos.map((info) => findTrafficAvoidance(info.route))),
      Promise.all(routeInfos.map((info) => findStopSigns(info.route))),
    ])

    const segments = trafficResults.flatMap((r) => r.segments)
    const stopSignBoxes = stopSignResults.flat().map((r) => r.avoidZone)

    console.log(
      `[BetterWay] Collected avoid data: ${segments.length} segments, ${stopSignBoxes.length} stop sign areas`,
    )

    const processed = await calculateBetterRoute(start, end, { segments, stopSignBoxes })
    improvedRoutes.push(...processed)
  }

  console.log(`[BetterWay] Returning ${improvedRoutes.length} improved routes`)
  return improvedRoutes
}
