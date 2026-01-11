import type { RoutePoint } from '@/entities'

import { EARTH_RADIUS_METERS, toDegrees, toRadians } from './constants'

/**
 * Calculate a point offset from a given location in the opposite direction of a bearing.
 */

/**
 * Returns a point that is a given distance behind the original point,
 * in the opposite direction of the bearing.
 */
export function getPointBehind(
  point: RoutePoint,
  bearing: number,
  distanceMeters: number = 20,
): RoutePoint {
  // Reverse the bearing (add 180 degrees and normalize)
  const reverseBearing = (bearing + 180) % 360

  const lat1 = toRadians(point.lat)
  const lng1 = toRadians(point.lng)
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS
  const bearingRad = toRadians(reverseBearing)

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad),
  )

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    )

  return {
    lat: toDegrees(lat2),
    lng: toDegrees(lng2),
  }
}
