/**
 * Better Way Routing
 * Smart routing that automatically finds routes avoiding traffic
 */

import { calculateRoute, type RoutingOptions, type Route } from '@/lib/here-sdk/route'
import {
  generateAvoidZones,
  formatAvoidZonesForApi,
  mergeOverlappingZones,
  getTrafficSummary,
  type AvoidZone,
  type TrafficSummary,
} from '@/utils/traffic'

/** Result of a better way route calculation */
export interface BetterWayResult {
  /** The original route (may have traffic) */
  originalRoute: Route
  /** Traffic summary for the original route */
  originalTraffic: TrafficSummary
  /** Alternative route avoiding traffic (if found and better) */
  betterRoute: Route | null
  /** Traffic summary for the better route */
  betterTraffic: TrafficSummary | null
  /** Time saved in seconds (positive = better route is faster) */
  timeSaved: number
  /** Avoid zones that were generated */
  avoidZones: AvoidZone[]
  /** Whether a better route was found */
  hasBetterRoute: boolean
}

/** Options for better way routing */
export interface BetterWayOptions extends Omit<RoutingOptions, 'avoid'> {
  /** Minimum slowdown to consider avoiding (0-1, default: 0.25 = 25%) */
  slowdownThreshold?: number
  /** Radius around traffic points to avoid in meters (default: 500) */
  avoidRadiusMeters?: number
  /** Minimum time savings to consider a route "better" in seconds (default: 60) */
  minTimeSavings?: number
  /** Include incidents in avoid zones (default: true) */
  avoidIncidents?: boolean
  /** Include slowdowns in avoid zones (default: true) */
  avoidSlowdowns?: boolean
}

/**
 * Calculate a route and automatically find a better alternative if there's traffic
 */
export async function findBetterWay(options: BetterWayOptions): Promise<BetterWayResult> {
  const {
    slowdownThreshold = 0.25,
    avoidRadiusMeters = 500,
    minTimeSavings = 60,
    avoidIncidents = true,
    avoidSlowdowns = true,
    ...routingOptions
  } = options

  // Ensure we request the data needed for traffic analysis
  const fullReturnTypes = [
    'polyline',
    'summary',
    'turnByTurnActions',
    'incidents',
    'typicalDuration',
    ...(routingOptions.return ?? []),
  ]
  const fullSpanTypes = [
    'dynamicSpeedInfo',
    'functionalClass',
    'incidents',
    ...(routingOptions.spans ?? []),
  ]

  // 1. Get original route
  const originalResult = await calculateRoute({
    ...routingOptions,
    return: [...new Set(fullReturnTypes)] as RoutingOptions['return'],
    spans: [...new Set(fullSpanTypes)] as RoutingOptions['spans'],
  })

  const originalRoute = originalResult.routes[0]
  if (!originalRoute) {
    throw new Error('No route found')
  }

  const originalSection = originalRoute.sections[0]
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

  // If no traffic issues, return original route
  if (avoidZones.length === 0) {
    return {
      originalRoute,
      originalTraffic,
      betterRoute: null,
      betterTraffic: null,
      timeSaved: 0,
      avoidZones: [],
      hasBetterRoute: false,
    }
  }

  // 3. Merge and format avoid zones
  const mergedZones = mergeOverlappingZones(avoidZones)
  const avoidAreas = formatAvoidZonesForApi(mergedZones)

  // 4. Get alternative route avoiding traffic
  let betterRoute: Route | null = null
  let betterTraffic: TrafficSummary | null = null

  try {
    const betterResult = await calculateRoute({
      ...routingOptions,
      return: [...new Set(fullReturnTypes)] as RoutingOptions['return'],
      spans: [...new Set(fullSpanTypes)] as RoutingOptions['spans'],
      avoid: { areas: avoidAreas },
    })

    betterRoute = betterResult.routes[0] ?? null
    if (betterRoute?.sections[0]) {
      betterTraffic = getTrafficSummary(betterRoute.sections[0])
    }
  } catch {
    // If avoid routing fails, just return original
    console.warn('Could not find route avoiding traffic areas')
  }

  // 5. Calculate time saved
  const originalDuration = originalSection.summary.duration
  const betterDuration = betterRoute?.sections[0]?.summary.duration ?? originalDuration
  const timeSaved = originalDuration - betterDuration

  // 6. Determine if the better route is actually better
  const hasBetterRoute = betterRoute !== null && timeSaved >= minTimeSavings

  return {
    originalRoute,
    originalTraffic,
    betterRoute: hasBetterRoute ? betterRoute : null,
    betterTraffic: hasBetterRoute ? betterTraffic : null,
    timeSaved: hasBetterRoute ? timeSaved : 0,
    avoidZones: mergedZones,
    hasBetterRoute,
  }
}

/**
 * Get the best route from a BetterWayResult
 */
export function getBestRoute(result: BetterWayResult): Route {
  return result.hasBetterRoute && result.betterRoute ? result.betterRoute : result.originalRoute
}

/**
 * Format time saved as a human-readable string
 */
export function formatTimeSaved(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`
  }
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
}
