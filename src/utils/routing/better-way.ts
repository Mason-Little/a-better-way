/**
 * Better Way Routing
 * Smart routing that automatically finds routes avoiding traffic
 */

import { calculateRoute } from '@/lib/here-sdk/route'
import type {
  RoutingOptions,
  Route,
  BetterWayResult,
  BetterWayOptions,
  TrafficSummary,
} from '@/entities'
import {
  generateAvoidZones,
  formatAvoidZonesForApi,
  mergeOverlappingZones,
  getTrafficSummary,
} from '@/utils/traffic'

// Re-export types for convenience
export type { BetterWayResult, BetterWayOptions }

/** Required return types for traffic analysis */
const REQUIRED_RETURN_TYPES = ['polyline', 'summary', 'turnByTurnActions', 'incidents', 'typicalDuration'] as const

/** Required span types for traffic analysis */
const REQUIRED_SPAN_TYPES = ['dynamicSpeedInfo', 'functionalClass', 'incidents'] as const

/** Merge required types with user-provided types, removing duplicates */
function mergeUniqueTypes<T extends string>(required: readonly T[], userProvided: T[] | undefined): T[] {
  if (!userProvided || userProvided.length === 0) {
    return [...required]
  }
  const combined = [...required, ...userProvided]
  return [...new Set(combined)]
}

/** Extract the first section from a route, or null if not available */
function getFirstSection(route: Route | null | undefined) {
  if (!route) return null
  if (route.sections.length === 0) return null
  return route.sections[0]
}

/**
 * Calculate a route and automatically find a better alternative if there's traffic
 */
export async function findBetterWay(options: BetterWayOptions): Promise<BetterWayResult> {
  // Extract better-way specific options with defaults
  const slowdownThreshold = options.slowdownThreshold ?? 0.25
  const avoidRadiusMeters = options.avoidRadiusMeters ?? 500
  const minTimeSavings = options.minTimeSavings ?? 60
  const avoidIncidents = options.avoidIncidents ?? true
  const avoidSlowdowns = options.avoidSlowdowns ?? true
  const alternatives = options.alternatives ?? 6

  // Build base routing options (exclude better-way specific fields)
  const baseRoutingOptions: RoutingOptions = {
    origin: options.origin,
    destination: options.destination,
    return: options.return,
    spans: options.spans,
    transportMode: options.transportMode,
    routingMode: options.routingMode,
    departureTime: options.departureTime,
  }

  // Build the full return and span types needed for traffic analysis
  const returnTypes = mergeUniqueTypes(REQUIRED_RETURN_TYPES, baseRoutingOptions.return)
  const spanTypes = mergeUniqueTypes(REQUIRED_SPAN_TYPES, baseRoutingOptions.spans)

  // 1. Get original routes (with alternatives)
  const originalResult = await calculateRoute({
    ...baseRoutingOptions,
    alternatives,
    return: returnTypes as RoutingOptions['return'],
    spans: spanTypes as RoutingOptions['spans'],
  })

  const allRoutes = originalResult.routes
  const originalRoute = allRoutes[0]

  if (!originalRoute) {
    throw new Error('No route found')
  }

  const originalSection = getFirstSection(originalRoute)
  if (!originalSection) {
    throw new Error('Route has no sections')
  }

  const originalTraffic = getTrafficSummary(originalSection)

  // 2. Generate avoid zones from traffic issues
  const avoidZones = generateAvoidZones(originalSection, {
    radiusMeters: avoidRadiusMeters,
    slowdownThreshold,
    includeIncidents: avoidIncidents,
    includeSlowdowns: avoidSlowdowns,
  })

  // If no traffic issues found, return original route as-is
  if (avoidZones.length === 0) {
    return {
      originalRoute,
      originalTraffic,
      betterRoute: null,
      betterTraffic: null,
      timeSaved: 0,
      avoidZones: [],
      hasBetterRoute: false,
      allRoutes,
    }
  }

  // 3. Merge and format avoid zones for the API
  const mergedZones = mergeOverlappingZones(avoidZones)
  const avoidAreas = formatAvoidZonesForApi(mergedZones)

  // 4. Try to get an alternative route that avoids traffic
  let betterRoute: Route | null = null
  let betterTraffic: TrafficSummary | null = null

  try {
    const betterResult = await calculateRoute({
      ...baseRoutingOptions,
      return: returnTypes as RoutingOptions['return'],
      spans: spanTypes as RoutingOptions['spans'],
      avoid: { areas: avoidAreas },
    })

    betterRoute = betterResult.routes[0] ?? null

    const betterSection = getFirstSection(betterRoute)
    if (betterSection) {
      betterTraffic = getTrafficSummary(betterSection)
    }
  } catch {
    console.warn('Could not find route avoiding traffic areas')
  }

  // 5. Calculate time saved
  const originalDuration = originalSection.summary.duration
  const betterSection = getFirstSection(betterRoute)
  const betterDuration = betterSection ? betterSection.summary.duration : originalDuration
  const timeSaved = originalDuration - betterDuration

  // 6. Determine if the better route is actually worth taking
  const hasBetterRoute = betterRoute !== null && timeSaved >= minTimeSavings

  return {
    originalRoute,
    originalTraffic,
    betterRoute: hasBetterRoute ? betterRoute : null,
    betterTraffic: hasBetterRoute ? betterTraffic : null,
    timeSaved: hasBetterRoute ? timeSaved : 0,
    avoidZones: mergedZones,
    hasBetterRoute,
    allRoutes,
  }
}

/**
 * Get the best route from a BetterWayResult
 */
export function getBestRoute(result: BetterWayResult): Route {
  return result.hasBetterRoute && result.betterRoute ? result.betterRoute : result.originalRoute
}
