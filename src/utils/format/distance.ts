/**
 * Distance Formatting Utilities
 * Human-readable distance formatting
 */

/**
 * Format distance in meters to human-readable string
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}
