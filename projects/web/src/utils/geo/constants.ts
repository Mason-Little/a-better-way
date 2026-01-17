/**
 * Geo Constants & Conversion Utilities
 * Shared constants and functions for geographic calculations
 */

/** Earth radius in meters */
export const EARTH_RADIUS_METERS = 6371000

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

/**
 * Approximate degrees per meter at equator
 * For latitude: 1 degree ≈ 111,320 meters
 */
export const LAT_DEG_PER_METER = 1 / 111320

/**
 * Get longitude degrees per meter at a given latitude
 */
export function getLngDegPerMeter(lat: number): number {
  return 1 / (111320 * Math.cos(toRadians(lat)))
}
