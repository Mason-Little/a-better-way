import { decode } from '@here/flexpolyline'

import type { BBox, LatLng } from '@/entities'

const EARTH_RADIUS = 6371000
const LAT_DEG_PER_M = 1 / 111320

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function lngDegPerM(lat: number) {
  return 1 / (111320 * Math.cos(toRad(lat)))
}

/** Decode a HERE flexible polyline string into an array of points */
export function decodePolyline(polyline: string): LatLng[] {
  const result = decode(polyline)
  return result.polyline
    .filter((c): c is [number, number] => c[0] !== undefined && c[1] !== undefined)
    .map(([lat, lng]) => ({ lat, lng }))
}

/** Create a bounding box around a point with given radius in meters */
export function createBBox(point: LatLng, radiusMeters: number): BBox {
  const latOff = radiusMeters * LAT_DEG_PER_M
  const lngOff = radiusMeters * lngDegPerM(point.lat)
  return {
    north: point.lat + latOff,
    south: point.lat - latOff,
    east: point.lng + lngOff,
    west: point.lng - lngOff,
  }
}

/** Format bounding boxes for HERE API avoid[areas] parameter */
export function formatBBoxes(boxes: BBox[]): string[] {
  return boxes.map((b) => `bbox:${b.west},${b.south},${b.east},${b.north}`)
}

/** Calculate distance between two points in meters using Haversine formula */
export function distance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/** Calculate bearing in degrees between two points */
export function bearing(from: LatLng, to: LatLng): number {
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const dLon = toRad(to.lng - from.lng)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Get a point offset behind the given point in the opposite direction of heading */
export function pointBehind(point: LatLng, headingDeg: number, meters = 20): LatLng {
  const reverseBearing = (headingDeg + 180) % 360
  const angular = meters / EARTH_RADIUS
  const bearingRad = toRad(reverseBearing)

  const lat1 = toRad(point.lat)
  const lng1 = toRad(point.lng)

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearingRad),
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    )

  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI }
}

/** Merge multiple bounding boxes into one that covers all with margin */
export function mergeBBoxes(boxes: BBox[]): BBox {
  if (boxes.length === 0) return { north: 0, south: 0, east: 0, west: 0 }

  const bounds = boxes.reduce(
    (acc, b) => ({
      north: Math.max(acc.north, b.north),
      south: Math.min(acc.south, b.south),
      east: Math.max(acc.east, b.east),
      west: Math.min(acc.west, b.west),
    }),
    { north: -90, south: 90, east: -180, west: 180 },
  )

  const margin = 0.005
  return {
    north: bounds.north + margin,
    south: bounds.south - margin,
    east: bounds.east + margin,
    west: bounds.west - margin,
  }
}
