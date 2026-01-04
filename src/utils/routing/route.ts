/**
 * Route Utilities
 * High-level routing logic that uses the HERE SDK wrapper
 */

import type { Route, RouteInfo, RoutePoint, RouteSection, RoutingOptions } from '@/entities'
import { calculateRoute } from '@/lib/here-sdk/route'
import { formatDistance, formatDuration } from '@/utils/format'

// Re-export types for convenience
export type { Route, RoutePoint, RouteSection, RoutingOptions, RouteInfo }

/**
 * Calculate route summary from sections
 */
function getRouteSummary(route: Route): { duration: number; distance: number } {
  let totalDuration = 0
  let totalDistance = 0

  for (const section of route.sections) {
    totalDuration += section.summary.duration
    totalDistance += section.summary.length
  }

  return { duration: totalDuration, distance: totalDistance }
}

/** Get routes between two coordinate points - use when you already have coordinates */
export async function getRoutes(
  origin: RoutePoint,
  destination: RoutePoint,
  options?: Partial<RoutingOptions>,
): Promise<RouteInfo[]> {
  const result = await calculateRoute({
    origin,
    destination,
    ...options,
  })

  return result.routes.map((route) => {
    const { duration, distance } = getRouteSummary(route)

    return {
      route,
      duration,
      distance,
      formattedDuration: formatDuration(duration),
      formattedDistance: formatDistance(distance),
    }
  })
}
