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
    ...(avoid && { avoid }),
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

/** Geocode an address string to coordinates using HERE Search API */
export async function geocodeAddress(
  address: string
): Promise<RoutePoint | null> {
  const platform = getPlatform()
  const service = platform.getSearchService()

  return new Promise((resolve, reject) => {
    service.geocode(
      { q: address },
      (result: H.service.GeocodingService.Result) => {
        const position = result.items?.[0]?.position
        if (position) {
          resolve({ lat: position.lat, lng: position.lng })
        } else {
          resolve(null)
        }
      },
      (error: Error) => {
        reject(error)
      }
    )
  })
}
