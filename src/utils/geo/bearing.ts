import type { RoutePoint } from '@/entities'

/**
 * Calculate the bearing (heading) between two geographic points.
 * Returns bearing in degrees (0-360), where 0 = North, 90 = East, etc.
 */

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

/**
 * Calculates the bearing from point A to point B.
 */
export function calculateBearing(to: RoutePoint, from: RoutePoint): number {
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const dLon = toRadians(to.lng - from.lng)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  const bearing = toDegrees(Math.atan2(y, x))
  return (bearing + 360) % 360 // Normalize to 0-360
}
