/**
 * Polyline Utilities
 * HERE flexible polyline decoding
 */

import { decode, encode } from '@here/flexpolyline'

import type { RoutePoint } from '@/entities'

/**
 * Decode HERE flexible polyline to array of points
 */
export function decodePolyline(polyline: string): RoutePoint[] {
  const result = decode(polyline)
  return result.polyline
    .filter(
      (coords): coords is [number, number] | [number, number, number] =>
        coords[0] !== undefined && coords[1] !== undefined,
    )
    .map((coords) => ({ lat: coords[0], lng: coords[1] }))
}

/**
 * Simplify a encoded polyline string to ensure it has fewer than maxPoints
 * Used for API constraints (e.g. Traffic Corridor limit of 300 points)
 */
export function simplifyPolyline(encoded: string, maxPoints = 300): string {
  try {
    const decoded = decode(encoded)
    const points = decoded.polyline

    if (points.length <= maxPoints) {
      return encoded
    }

    // Simple downsampling
    const step = Math.ceil(points.length / maxPoints)
    const simplifiedPoints = points.filter((_, index) => index % step === 0)

    // Ensure last point is always included
    const lastPoint = points[points.length - 1]

    if (lastPoint && simplifiedPoints[simplifiedPoints.length - 1] !== lastPoint) {
      simplifiedPoints.push(lastPoint)
    }

    // Re-encode
    return encode({
      polyline: simplifiedPoints,
    })
  } catch (err) {
    console.error('Failed to simplify polyline:', err)
    return encoded
  }
}
