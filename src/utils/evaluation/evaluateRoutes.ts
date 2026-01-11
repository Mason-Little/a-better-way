/**
 * Route Evaluation Utilities
 * Determine which avoidance zones each route passes through
 */

import type { BoundingBox, PrioritizedSegment, Route, RouteEvaluation } from '@/entities'
import { isPointInBoundingBox } from '@/utils/geo/bounding-box'
import { decodePolyline } from '@/utils/geo/polyline'
import { findMatchingSegments } from '@/utils/traffic/matcher'

/**
 * Evaluate routes against avoidance zones
 * Returns a Map of route ID -> evaluation results
 */
export function evaluateRoutes(
  routes: Route[],
  trafficSegments: PrioritizedSegment[],
  stopSignBoxes: BoundingBox[],
): Map<string, RouteEvaluation> {
  const results = new Map<string, RouteEvaluation>()

  for (const route of routes) {
    // 1. Check traffic segment intersections for this single route
    const { matches: intersectingSegments } = findMatchingSegments(trafficSegments, [route])

    // 2. Check stop sign box intersections by decoding polyline
    const polyline = route.sections[0]?.polyline
    let stopSignCount = 0

    if (polyline && stopSignBoxes.length > 0) {
      const points = decodePolyline(polyline)

      // Check if any route point falls within any stop sign bounding box
      for (const box of stopSignBoxes) {
        const hasIntersection = points.some((point) => isPointInBoundingBox(point, box))
        if (hasIntersection) {
          stopSignCount++
        }
      }
    }

    // 3. Calculate total avoidance score (simple sum for now)
    const totalScore = intersectingSegments.length + stopSignCount

    const evaluation: RouteEvaluation = {
      intersectingTrafficSegments: intersectingSegments.length,
      intersectingStopSignBoxes: stopSignCount,
      totalAvoidanceScore: totalScore,
    }

    results.set(route.id, evaluation)
  }

  return results
}
