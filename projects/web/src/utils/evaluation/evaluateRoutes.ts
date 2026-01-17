/**
 * Route Evaluation Utilities
 * Determine which avoidance zones each route passes through
 */

import type { BoundingBox, PrioritizedSegment, Route, RouteEvaluation } from '@/entities'

import { calculateRouteCost } from './scoring'

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
    const score = calculateRouteCost(route, trafficSegments, stopSignBoxes)

    const evaluation: RouteEvaluation = {
      intersectingTrafficSegments: score.intersectingSegments,
      intersectingStopSignBoxes: score.stopSignCount,
      totalAvoidanceScore: score.totalScore, // Now represents total delay in seconds
    }

    results.set(route.id, evaluation)
  }

  return results
}
