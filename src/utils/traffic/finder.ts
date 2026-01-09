import type { FlowResponse, Route } from '@/entities'
import type { PrioritizedSegment } from '@/entities/traffic'
import { useRoutesStore } from '@/stores/routesStore'
import { fetchTrafficFlowByBbox } from '@/lib/here-sdk/traffic'
import { computeRouteBoundingBox, isRouteWithinBoundingBox, mergeBoundingBoxes } from '@/utils/geo'

import { getCongestedSegments } from './avoidance'

/**
 * Find traffic avoidance segments using a single bounding box query
 * with intelligent caching to minimize API calls
 */
export async function findTrafficAvoidance(
  routes: Route[],
  slowdownThreshold = 0.3,
): Promise<PrioritizedSegment[]> {
  const store = useRoutesStore()

  if (routes.length === 0) {
    console.log('[Traffic] No routes to analyze')
    return []
  }

  // 1. Compute merged bounding box from all routes
  const routeBboxes = routes.map(computeRouteBoundingBox)
  const mergedBbox = mergeBoundingBoxes(routeBboxes)

  // 2. Check if we need to fetch new traffic data
  const currentCoverage = store.getTrafficCoverageBbox()
  const needsNewFetch =
    !currentCoverage || !routes.every((r) => isRouteWithinBoundingBox(r, currentCoverage))

  // 3. Fetch or use cached
  let flowData: FlowResponse | null

  if (needsNewFetch) {
    console.log('[Traffic] Fetching new traffic data for expanded bbox')
    flowData = await fetchTrafficFlowByBbox(mergedBbox)
    store.setTrafficCoverageBbox(mergedBbox)
    store.setCachedTrafficFlow(flowData)
  } else {
    console.log('[Traffic] Using cached traffic data')
    flowData = store.getCachedTrafficFlow()
  }

  // 4. Process segments
  if (!flowData) {
    console.log('[Traffic] No flow data available')
    return []
  }

  const segments = getCongestedSegments(flowData, slowdownThreshold)

  if (segments.length > 0) {
    console.log(`[Traffic] Generated ${segments.length} avoidance segments`)
  }

  return segments
}
