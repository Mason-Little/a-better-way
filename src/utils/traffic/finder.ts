import type { AvoidanceResult, Route } from '@/entities'
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
  route: Route,
  slowdownThreshold = 0.5,
): Promise<AvoidanceResult> {
  const flowData = await fetchRouteTrafficFlow(route)

  if (!flowData) {
    return { segments: [] }
  }

  const segments = getCongestedSegments(flowData, slowdownThreshold)

  if (segments.length > 0) {
    console.log(`[Traffic] Generated ${segments.length} avoidance segments`)
  }

  return { segments }
}
