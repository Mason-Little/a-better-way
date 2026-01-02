/**
 * Unit Conversion Utilities
 * Speed and measurement conversions
 */

/**
 * Convert m/s to mph
 */
export function msToMph(metersPerSecond: number): number {
  return metersPerSecond * 2.23694
}

/**
 * Convert m/s to km/h
 */
export function msToKmh(metersPerSecond: number): number {
  return metersPerSecond * 3.6
}
