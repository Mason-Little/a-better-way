/**
 * Route Utilities
 * High-level routing logic that uses the HERE SDK wrapper
 */

import { calculateRoute, geocodeAddress } from '@/lib/here-sdk/route'
import type { Route, RoutePoint, RoutingOptions, RouteSection, RouteInfo } from '@/entities'
import { drawRoutes as drawRoutesOnMap } from '@/stores/mapStore'
import { formatDuration, formatDistance } from '@/utils/format'

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

/** Get routes between two addresses - main entry point for routing functionality */
export async function getRoutes(
  startAddress: string,
  endAddress: string,
  options?: Partial<RoutingOptions>
): Promise<RouteInfo[]> {
  // Geocode both addresses
  const [origin, destination] = await Promise.all([
    geocodeAddress(startAddress),
    geocodeAddress(endAddress),
  ])

  if (!origin) {
    throw new Error(`Could not geocode start address: ${startAddress}`)
  }

  if (!destination) {
    throw new Error(`Could not geocode destination: ${endAddress}`)
  }

  // Calculate the route with full details
  // Note: turnByTurnActions includes all action data + road names, so we skip 'actions'
  // Spans are used only for traffic data (dynamicSpeedInfo) since road names come from actions
  const routes = await calculateRoute({
    origin,
    destination,
    alternatives: 6, // Get up to 6 alternative routes
    return: [
      'polyline',
      'summary',
      'turnByTurnActions', // Full turn-by-turn with road names (includes instructions)
      'incidents',         // Traffic incidents
      'typicalDuration',   // For comparing actual vs typical travel time
    ],
    spans: [
      'dynamicSpeedInfo',  // Real-time traffic (trafficSpeed, baseSpeed, jamFactor)
      'functionalClass',   // Road type (1=highway, 5=local)
      'gates',             // Toll booths, barriers
      'railwayCrossings',  // Railroad crossings
      'incidents',         // Incident locations on polyline
    ],
    ...options,
  })

  // Draw routes on the map (if map is available)
  drawRoutesOnMap(routes)

  // Transform routes to RouteInfo format
  return routes.routes.map((route) => {
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

/** Get routes between two coordinate points - use when you already have coordinates */
export async function getRoutesByCoordinates(
  origin: RoutePoint,
  destination: RoutePoint,
  options?: Partial<RoutingOptions>
): Promise<RouteInfo[]> {
  const result = await calculateRoute({
    origin,
    destination,
    alternatives: 3,
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
