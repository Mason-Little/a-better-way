/**
 * Polyline Utilities
 * HERE flexible polyline decoding
 */

import { decode } from '@here/flexpolyline'
import type { RoutePoint } from '@/entities'

/**
 * Decode HERE flexible polyline to array of points
 */
export function decodePolyline(polyline: string): RoutePoint[] {
  const result = decode(polyline)
  return result.polyline
    .filter((coords): coords is [number, number] | [number, number, number] =>
      coords[0] !== undefined && coords[1] !== undefined
    )
    .map((coords) => ({ lat: coords[0], lng: coords[1] }))
}
