/**
 * HERE Maps Routing Service
 * Low-level SDK wrapper for route calculation
 */

import { getPlatform } from './platform'
import type {
  RoutePoint,
  Route,
  RouteSection,
  RouteAction,
  RouteIncident,
  RouteSpan,
  RoutingOptions,
  RoutingResult,
  RouteReturnType,
  RouteSpanType,
} from '@/entities'

// Re-export types for convenience (backwards compatibility)
export type {
  RoutePoint,
  Route,
  RouteSection,
  RouteAction,
  RouteIncident,
  RouteSpan,
  RoutingOptions,
  RoutingResult,
  RouteReturnType,
  RouteSpanType,
}

/** Calculate a route between two points using HERE Routing API v8 */
export async function calculateRoute(
  options: RoutingOptions
): Promise<RoutingResult> {
  const platform = getPlatform()
  const router = platform.getRoutingService(null, 8)

  const {
    origin,
    destination,
    routingMode = 'fast',
    transportMode = 'car',
    return: returnTypes = ['polyline', 'summary'],
    spans: spanTypes,
    departureTime = 'any',
    alternatives = 0,
    avoid,
    via,
  } = options

  const routingParams: H.service.RoutingService8.CalculateRouteParams = {
    routingMode,
    transportMode,
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    return: returnTypes.join(','),
    departureTime,
    alternatives,
    ...(spanTypes?.length && { spans: spanTypes.join(',') }),
    ...(avoid?.areas?.length && { 'avoid[areas]': avoid.areas.join('|') }),
    ...(avoid?.features?.length && { 'avoid[features]': avoid.features.join(',') }),
    ...(via && { via: via.map(p => `${p.lat},${p.lng}!passThrough=true`) }),
  }

  return new Promise((resolve, reject) => {
    router.calculateRoute(
      routingParams,
      (result) => {
        resolve(result as RoutingResult)
      },
      (error: Error) => {
        reject(error)
      }
    )
  })
}
