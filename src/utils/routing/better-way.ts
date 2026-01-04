import type { Route, RoutePoint } from '@/entities'
import { drawRoutes } from '@/stores/mapStore'
import { calculateRoute } from '@/lib/here-sdk'
import { formatBoundingBox } from '@/utils/geo'
import { getRoutes } from '@/utils/routing/route'
import { findStopSigns, type StopSignResult } from '@/utils/stoplight'

//TODO: ADD Via Points to

async function findInitialRoutes(start: RoutePoint, end: RoutePoint) {
  return getRoutes(start, end, {
    transportMode: 'car',
    routingMode: 'short',
    // alternatives: 3,
    return: ['turnByTurnActions', 'summary', 'polyline'],
  })
}

async function calculateBetterRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  avoidZones: StopSignResult[],
): Promise<Route[]> {
  const avoidAreas = formatBoundingBox(avoidZones.map((zone) => zone.avoidZone))

  try {
    const matchResult = await calculateRoute({
      origin,
      destination,
      avoid: {
        areas: avoidAreas,
      },
      transportMode: 'car',
    })

    if (matchResult.routes && matchResult.routes.length > 0) {
      console.log(`[BetterWay] Successfully calculated better route`)
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
  }

  await new Promise((resolve) => setTimeout(resolve, 5000))

  const allStopSignResults = await Promise.all(
    routeInfos.map((routeInfo) => findStopSigns(routeInfo.route)),
  )

  const processed = await calculateBetterRoute(
    start,
    end,
    allStopSignResults.flatMap((result) => result),
  )
  improvedRoutes.push(...processed)

  console.log(`[BetterWay] Returning ${improvedRoutes.length} improved routes`)
  return improvedRoutes
}
