/**
 * Bounding Box Utilities
 * Shared geographic bounding box calculations
 */

import type { BoundingBox, PrioritizedSegment, Route, RoutePoint } from '@/entities'

import { getLngDegPerMeter, LAT_DEG_PER_METER } from './constants'
import { decodePolyline } from './polyline'

// ─────────────────────────────────────────────────────────────────────────────
// Bounding Box Key Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a unique key for a bounding box based on its center point coordinates.
 * Uses 4 decimal places (~10m accuracy) to handle floating point variations.
 */
export function getBoundingBoxKey(box: BoundingBox): string {
  const centerLat = ((box.north + box.south) / 2).toFixed(4)
  const centerLng = ((box.east + box.west) / 2).toFixed(4)
  return `${centerLat},${centerLng}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Bounding Box Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a bounding box around a point
 * Returns {north, south, east, west} object
 */
export function createBoundingBox(point: RoutePoint, radiusMeters: number): BoundingBox {
  const latOffset = radiusMeters * LAT_DEG_PER_METER
  const lngOffset = radiusMeters * getLngDegPerMeter(point.lat)

  return {
    north: point.lat + latOffset,
    south: point.lat - latOffset,
    east: point.lng + lngOffset,
    west: point.lng - lngOffset,
  }
}

/**
 * Format bounding boxes for HERE API avoid[areas] parameter
 */
export function formatBoundingBox(zones: BoundingBox[]): string[] {
  return zones.map((z) => `bbox:${z.west},${z.south},${z.east},${z.north}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Bounding Box Computation from Geometry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute bounding box from an array of points
 * Internal helper used by other compute functions
 */
function computeBoundingBoxFromPoints(points: RoutePoint[]): BoundingBox {
  if (points.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 }
  }

  let north = -90
  let south = 90
  let east = -180
  let west = 180

  for (const point of points) {
    if (point.lat > north) north = point.lat
    if (point.lat < south) south = point.lat
    if (point.lng > east) east = point.lng
    if (point.lng < west) west = point.lng
  }

  return { north, south, east, west }
}

/**
 * Compute bounding box from a route's polyline
 */
export function computeRouteBoundingBox(route: Route): BoundingBox {
  const polyline = route.sections?.[0]?.polyline
  if (!polyline) {
    return { north: 0, south: 0, east: 0, west: 0 }
  }

  const points = decodePolyline(polyline)
  return computeBoundingBoxFromPoints(points)
}

/**
 * Compute bounding box from a traffic segment's shape
 */
export function computeSegmentBoundingBox(segment: PrioritizedSegment): BoundingBox {
  if (!segment.shape || segment.shape.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 }
  }
  return computeBoundingBoxFromPoints(segment.shape)
}

// ─────────────────────────────────────────────────────────────────────────────
// Bounding Box Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge multiple bounding boxes into one that covers all
 * Adds a ~500m margin around the merged result
 */
export function mergeBoundingBoxes(boxes: BoundingBox[]): BoundingBox {
  if (boxes.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 }
  }

  let north = -90
  let south = 90
  let east = -180
  let west = 180

  for (const box of boxes) {
    if (box.north > north) north = box.north
    if (box.south < south) south = box.south
    if (box.east > east) east = box.east
    if (box.west < west) west = box.west
  }

  // Add ~500m margin (0.005 degrees is roughly 500m)
  const MARGIN = 0.005

  return {
    north: north + MARGIN,
    south: south - MARGIN,
    east: east + MARGIN,
    west: west - MARGIN,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bounding Box Checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a route is fully within a bounding box
 */
export function isRouteWithinBoundingBox(route: Route, bbox: BoundingBox): boolean {
  const routeBbox = computeRouteBoundingBox(route)

  return (
    routeBbox.north <= bbox.north &&
    routeBbox.south >= bbox.south &&
    routeBbox.east <= bbox.east &&
    routeBbox.west >= bbox.west
  )
}

/**
 * Check if two bounding boxes intersect (overlap)
 */
export function doBoundingBoxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return a.north >= b.south && a.south <= b.north && a.east >= b.west && a.west <= b.east
}

/**
 * Check if a point is within a bounding box
 */
export function isPointInBoundingBox(point: RoutePoint, bbox: BoundingBox): boolean {
  return (
    point.lat <= bbox.north &&
    point.lat >= bbox.south &&
    point.lng <= bbox.east &&
    point.lng >= bbox.west
  )
}
