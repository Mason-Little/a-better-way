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
  jamThreshold = 5,
): Promise<PrioritizedSegment[]> {
  const {
    getTrafficCoverageBbox,
    setTrafficCoverageBbox,
    getCachedTrafficFlow,
    setCachedTrafficFlow,
  } = useRoutesStore()

  if (routes.length === 0) {
    return []
  }

  // 1. Compute merged bounding box from all routes
  const routeBboxes = routes.map(computeRouteBoundingBox)
  const mergedBbox = mergeBoundingBoxes(routeBboxes)

  // 2. Check if we need to fetch new traffic data
  const currentCoverage = getTrafficCoverageBbox()
  const needsNewFetch =
    !currentCoverage || !routes.every((r) => isRouteWithinBoundingBox(r, currentCoverage))

  // 3. Fetch or use cached
  let flowData: FlowResponse | null

  if (needsNewFetch) {
    flowData = await fetchTrafficFlowByBbox(mergedBbox)
    setTrafficCoverageBbox(mergedBbox)
    setCachedTrafficFlow(flowData)
  } else {
    flowData = getCachedTrafficFlow()
  }

  // 4. Process segments
  if (!flowData) {
    return []
  }

  const segments = getCongestedSegments(flowData, jamThreshold)

  return segments
}
