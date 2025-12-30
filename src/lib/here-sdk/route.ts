/**
 * HERE Maps Routing Service
 * Low-level SDK wrapper for route calculation
 */

import { getPlatform } from './platform'

export interface RoutePoint {
  lat: number
  lng: number
}

export interface RouteSection {
  /** Unique section ID */
  id: string
  /** Section type (e.g., 'vehicle') */
  type: string
  /** Departure location */
  departure: {
    place: {
      location: RoutePoint
    }
  }
  /** Arrival location */
  arrival: {
    place: {
      location: RoutePoint
    }
  }
  /** Encoded polyline for the section geometry */
  polyline: string
  /** Summary with distance and duration */
  summary: {
    /** Duration in seconds */
    duration: number
    /** Length in meters */
    length: number
  }
  /** Transport mode used */
  transport: {
    mode: string
  }
}

export interface Route {
  /** Unique route ID */
  id: string
  /** Route sections */
  sections: RouteSection[]
}

export interface RoutingResult {
  routes: Route[]
}

export interface RoutingOptions {
  /** Origin coordinates */
  origin: RoutePoint
  /** Destination coordinates */
  destination: RoutePoint
  /** Transport mode (defaults to 'car') */
  transportMode?: 'car' | 'truck' | 'pedestrian' | 'bicycle' | 'scooter'
  /** Return type (defaults to 'polyline') */
  return?: ('polyline' | 'summary' | 'actions' | 'instructions')[]
  /** Departure time (ISO 8601 string or 'any') */
  departureTime?: string
  /** Number of alternative routes to calculate (0-6) */
  alternatives?: number
}

/**
 * Calculate a route between two points using HERE Routing API v8
 * @param options Routing options including origin and destination
 */
export async function calculateRoute(
  options: RoutingOptions
): Promise<RoutingResult> {
  const platform = getPlatform()
  const router = platform.getRoutingService(null, 8)

  const {
    origin,
    destination,
    transportMode = 'car',
    return: returnTypes = ['polyline', 'summary'],
    departureTime = 'any',
    alternatives = 0,
  } = options

  const routingParams: H.service.RoutingService8.CalculateRouteParams = {
    routingMode: 'fast',
    transportMode,
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    return: returnTypes.join(','),
    departureTime,
    alternatives,
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

/**
 * Geocode an address string to coordinates using HERE Search API
 * @param address Address string to geocode
 */
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
