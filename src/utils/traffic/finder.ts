import type { AvoidanceResult, Route, TrafficAvoidanceOptions } from '@/entities'
import type { FlowItem } from '@/entities/traffic'
import { fetchTrafficFlow } from '@/lib/here-sdk/traffic'
import { simplifyPolyline } from '@/utils/geo/polyline'

import { hasTraffic } from './analysis'
import { getCongestedSegments } from './avoidance'

const DEFAULT_OPTIONS: TrafficAvoidanceOptions = {
  jamFactorThreshold: 8,
  speedReductionThreshold: 0.5,
}

/**
 * Fetch traffic flow data for a route if it has significant traffic
 */
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
    const jams = flowData.results.filter((item: FlowItem) => item.currentFlow?.jamFactor > 4)
    console.log(`[Traffic] Flow data received. Found ${jams.length} congested segments.`)

    // Visualize traffic on map
    const { useMapStore } = await import('@/stores/mapStore')
    const { parseTrafficFlowForMap } = await import('./visualization')
    const segments = parseTrafficFlowForMap(flowData)
    useMapStore().drawTraffic(segments)

    return flowData
  }

  return null
}

/**
 * Find traffic congestion on a route and return avoidance data
 * Similar to findStopSigns pattern
 */
export async function findTrafficAvoidance(
  route: Route,
  options: TrafficAvoidanceOptions = DEFAULT_OPTIONS,
): Promise<AvoidanceResult> {
  const flowData = await fetchRouteTrafficFlow(route)

  if (!flowData) {
    return { segments: [], areas: [] }
  }

  const result = getCongestedSegments(flowData, options)

  if (result.segments.length > 0 || result.areas.length > 0) {
    console.log(
      `[Traffic] Found congestion: ${result.areas.length} areas, ${result.segments.length} segments`,
    )
  }

  return result
}
