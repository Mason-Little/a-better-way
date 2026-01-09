import type { Route } from '@/entities'
import type { PrioritizedSegment } from '@/entities/traffic'
import { fetchTrafficFlow } from '@/lib/here-sdk/traffic'
import { simplifyPolyline } from '@/utils/geo/polyline'

import { hasTraffic } from './analysis'
import { getCongestedSegments } from './avoidance'

async function fetchRouteTrafficFlow(route: Route) {
  const likelyTraffic = hasTraffic(route)

  if (!likelyTraffic) {
    console.log('[Traffic] Route analysis indicates no significant traffic.')
    return null
  }

  console.log('[Traffic] Significant traffic detected. Fetching detailed flow...')

  const polyline = route.sections?.[0]?.polyline
  if (!polyline) {
    console.warn('[Traffic] No polyline found in route section.')
    return null
  }

  const simplifiedPolyline = simplifyPolyline(polyline)
  const flowData = await fetchTrafficFlow(simplifiedPolyline)

  if (flowData?.results) {
    return flowData
  }

  return null
}

export async function findTrafficAvoidance(
  routes: Route[],
  slowdownThreshold = 0.5,
): Promise<PrioritizedSegment[]> {
  const flowDataResults = await Promise.all(routes.map((route) => fetchRouteTrafficFlow(route)))

  const allSegments: PrioritizedSegment[] = []

  for (const flowData of flowDataResults) {
    if (flowData) {
      const segments = getCongestedSegments(flowData, slowdownThreshold)
      allSegments.push(...segments)
    }
  }

  if (allSegments.length > 0) {
    console.log(`[Traffic] Generated ${allSegments.length} avoidance segments`)
  }

  return allSegments
}
