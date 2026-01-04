/**
 * Bounding Box Utilities
 * Shared geographic bounding box calculations
 */

import type { AvoidZone, RoutePoint } from '@/entities'

/**
 * Create a bounding box (AvoidZone format) around a point
 * Returns {north, south, east, west} object
 */
export function createBoundingBox(point: RoutePoint, radiusMeters: number): AvoidZone {
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

/**
 * Create a bounding box as an array [west, south, east, north]
 * Useful for APIs that expect bbox in array format (e.g., Mapillary)
 */
export function createBboxArray(
  lat: number,
  lng: number,
  radiusMeters: number,
): [number, number, number, number] {
  const latDegPerMeter = 1 / 111320
  const lngDegPerMeter = 1 / (111320 * Math.cos((lat * Math.PI) / 180))

  const latOffset = radiusMeters * latDegPerMeter
  const lngOffset = radiusMeters * lngDegPerMeter

  return [
    lng - lngOffset, // west
    lat - latOffset, // south
    lng + lngOffset, // east
    lat + latOffset, // north
  ]
}
