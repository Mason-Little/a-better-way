/**
 * Traffic Check Utilities
 */

import type { Route } from '@/entities'
import type { FlowItem } from '@/entities/traffic'
import { fetchTrafficFlow } from '@/lib/here-sdk/traffic'

import { simplifyPolyline } from '@/utils/geo/polyline'
import { hasTraffic } from './analysis'

/**
 * Check for traffic on the route and return details if significant
 */
export async function checkTrafficOnRoute(route: Route) {
  // 1. Fast pre-check using routing response summary/spans
  const likelyTraffic = hasTraffic(route)

  if (!likelyTraffic) {
    console.log('[Traffic] Route analysis indicates no significant traffic.')
    return null
  }

  console.log('[Traffic] Significant traffic detected in route analysis. Fetching detailed flow...')

  // 2. Fetch real-time flow data for the route corridor
  // We use the first section's polyline for now (assuming single section or main section)
  const polyline = route.sections?.[0]?.polyline
  if (!polyline) {
    console.warn('[Traffic] No polyline found in route section.')
    return null
  }

  // Optimize polyline to meet API limits (max 300 points)

  const simplifiedPolyline = simplifyPolyline(polyline)

  const flowData = await fetchTrafficFlow(simplifiedPolyline)

  if (flowData?.results) {
    // Filter for jams
    const jams = flowData.results.filter((item: FlowItem) => item.currentFlow?.jamFactor > 4)
    console.log(
      `[Traffic] Flow data received. Found ${jams.length} congested segments (jamFactor > 4).`,
    )
    return jams
  }

  return null
}
