import type { RoutePoint } from '@/entities'

import { EARTH_RADIUS_METERS, toRadians } from './constants'

/**
 * Calculate the distance between two points in meters using the Haversine formula.
 */
export function calculateDistance(p1: RoutePoint, p2: RoutePoint): number {
  const dLat = toRadians(p2.lat - p1.lat)
  const dLng = toRadians(p2.lng - p1.lng)
  const lat1 = toRadians(p1.lat)
  const lat2 = toRadians(p2.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}
