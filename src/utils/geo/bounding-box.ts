/**
 * Bounding Box Utilities
 * Shared geographic bounding box calculations
 */

import type { BoundingBox, PrioritizedSegment, Route, RoutePoint } from '@/entities'

import { decodePolyline } from './polyline'

/**
 * Create a bounding box around a point
 * Returns {north, south, east, west} object
 */
export function createBoundingBox(point: RoutePoint, radiusMeters: number): BoundingBox {
  // Approximate degrees per meter (varies by latitude, but close enough for small radii)
  const latDegPerMeter = 1 / 111320
  const lngDegPerMeter = 1 / (111320 * Math.cos((point.lat * Math.PI) / 180))

  const latOffset = radiusMeters * latDegPerMeter
  const lngOffset = radiusMeters * lngDegPerMeter

  return {
    north: point.lat + latOffset,
    south: point.lat - latOffset,
    east: point.lng + lngOffset,
    west: point.lng - lngOffset,
  }
}

export function formatBoundingBox(zones: BoundingBox[]): string[] {
  return zones.map((z) => `bbox:${z.west},${z.south},${z.east},${z.north}`)
}

/**
 * Compute bounding box from a route's polyline
 */
export function computeRouteBoundingBox(route: Route): BoundingBox {
  const polyline = route.sections?.[0]?.polyline
  if (!polyline) {
    // Return a zero-size bbox if no polyline
    return { north: 0, south: 0, east: 0, west: 0 }
  }

  const points = decodePolyline(polyline)
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
 * Merge multiple bounding boxes into one that covers all
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
 * Check if two bounding boxes intersect
 */
export function doBoundingBoxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return a.north >= b.south && a.south <= b.north && a.east >= b.west && a.west <= b.east
}

/**
 * Compute bounding box from a traffic segment
 */
export function computeSegmentBoundingBox(segment: PrioritizedSegment): BoundingBox {
  if (!segment.shape || segment.shape.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 }
  }

  let north = -90
  let south = 90
  let east = -180
  let west = 180

  for (const point of segment.shape) {
    if (point.lat > north) north = point.lat
    if (point.lat < south) south = point.lat
    if (point.lng > east) east = point.lng
    if (point.lng < west) west = point.lng
  }

  return { north, south, east, west }
}
