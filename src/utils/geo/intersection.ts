/**
 * Intersection Utilities
 * Determine if geographic entities intersect
 */

import type { PrioritizedSegment, RoutePoint } from '@/entities'

/**
 * Calculate distance in meters between two points
 * Using Haversine formula
 */
function getDistanceMeters(p1: RoutePoint, p2: RoutePoint): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate perpendicular distance from point P to line segment AB
 */
function getDistanceFromPointToSegment(p: RoutePoint, a: RoutePoint, b: RoutePoint): number {
  const x = p.lng
  const y = p.lat
  const x1 = a.lng
  const y1 = a.lat
  const x2 = b.lng
  const y2 = b.lat

  const A = x - x1
  const B = y - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D

  // Parameter of the projection
  let param = -1
  if (lenSq !== 0) param = dot / lenSq

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  return getDistanceMeters(p, { lat: yy, lng: xx })
}

/**
 * Check if a point is within threshold meters of a polyline
 */
function isPointNearPolyline(
  point: RoutePoint,
  polyline: RoutePoint[],
  thresholdMeters: number,
): boolean {
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i]!
    const p2 = polyline[i + 1]!
    const dist = getDistanceFromPointToSegment(point, p1, p2)
    if (dist <= thresholdMeters) return true
  }
  return false
}

/**
 * Check if a traffic segment intersects with a route
 * Uses bounding box pre-check for performance
 */
export function doesSegmentIntersectRoute(
  segment: PrioritizedSegment,
  routePoints: RoutePoint[],
  thresholdMeters: number = 30, // Default to ~30m (road width + GPS error)
): boolean {
  if (!segment.shape || segment.shape.length === 0) return false
  if (routePoints.length === 0) return false

  // Efficient approach:
  // Iterate through segment points. If ANY point is near the route, it's a "hit".
  // This means the traffic jam is ON that road.

  for (const point of segment.shape) {
    if (isPointNearPolyline(point, routePoints, thresholdMeters)) {
      return true
    }
  }

  return false
}
