/**
 * Route Scoring Logic
 * Calculates cost of routes based on traffic and stop signs
 */

import type { BoundingBox, PrioritizedSegment, Route } from '@/entities'
import { isPointInBoundingBox } from '@/utils/geo/bounding-box'
import { decodePolyline } from '@/utils/geo/polyline'
import { findMatchingSegments } from '@/utils/traffic/matcher'

export interface RouteScore {
  trafficDelay: number // Seconds lost to traffic
  stopSignDelay: number // Seconds lost to stop signs
  totalScore: number // Total "cost" in seconds
  intersectingSegments: number
  stopSignCount: number
}

const STOP_SIGN_PENALTY_SECONDS = 15

/**
 * Calculate the cost of a route
 */
export function calculateRouteCost(
  route: Route,
  trafficSegments: PrioritizedSegment[],
  stopSignBoxes: BoundingBox[],
): RouteScore {
  // 1. Calculate Traffic Delay
  const { matches: intersectingSegments } = findMatchingSegments(trafficSegments, [route])

  let trafficDelay = 0
  for (const segment of intersectingSegments) {
    if (segment.length && segment.speed && segment.speed > 0) {
      const travelTime = segment.length / segment.speed
      const freeFlow = segment.freeFlow || segment.speed
      const freeFlowTime = segment.length / freeFlow
      const delay = Math.max(0, travelTime - freeFlowTime)
      trafficDelay += delay
    }
  }

  // 2. Calculate Stop Sign Delay
  let stopSignCount = 0
  if (route.sections[0]?.polyline && stopSignBoxes.length > 0) {
    const points = decodePolyline(route.sections[0].polyline)
    for (const box of stopSignBoxes) {
      if (points.some((point) => isPointInBoundingBox(point, box))) {
        stopSignCount++
      }
    }
  }

  const stopSignDelay = stopSignCount * STOP_SIGN_PENALTY_SECONDS

  return {
    trafficDelay,
    stopSignDelay,
    totalScore: trafficDelay + stopSignDelay,
    intersectingSegments: intersectingSegments.length,
    stopSignCount,
  }
}
