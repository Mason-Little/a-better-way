/**
 * HERE Maps Routing Service
 * Low-level SDK wrapper for route calculation
 */

import { getPlatform } from './platform'

export interface RoutePoint {
  lat: number
  lng: number
}

/** Action/maneuver on the route */
export interface RouteAction {
  /** Type of action (e.g., 'depart', 'arrive', 'turn', 'continue') */
  action: string
  /** Duration of this action in seconds */
  duration: number
  /** Length of this action in meters */
  length: number
  /** Human-readable instruction (if requested) */
  instruction?: string
  /** Direction of the action (e.g., 'left', 'right', 'straight') */
  direction?: string
  /** Severity of the turn (e.g., 'light', 'normal', 'quite') */
  severity?: string
  /** Offset in the polyline where this action occurs */
  offset: number
  /** Exit number for roundabouts/highways */
  exit?: number
  /** Road name after this action */
  nextRoad?: {
    name?: { value: string; language: string }[]
    number?: { value: string; language: string }[]
  }
  /** Current road info */
  currentRoad?: {
    name?: { value: string; language: string }[]
    number?: { value: string; language: string }[]
  }
}

/** Traffic incident on the route */
export interface RouteIncident {
  /** Incident ID */
  id: string
  /** Type of incident (e.g., 'accident', 'construction', 'congestion') */
  type: string
  /** Severity (e.g., 'minor', 'major', 'critical') */
  severity?: string
  /** Description of the incident */
  description?: string
  /** Start offset in polyline */
  startOffset?: number
  /** End offset in polyline */
  endOffset?: number
}

/** Span data for a segment of the route */
export interface RouteSpan {
  /** Offset in polyline where span starts */
  offset: number
  /** Functional class (1-5, 1=highway, 5=local) */
  functionalClass?: number
  /** Dynamic speed info (traffic) */
  dynamicSpeedInfo?: {
    /** Traffic speed in m/s */
    trafficSpeed?: number
    /** Base speed without traffic in m/s */
    baseSpeed?: number
    /** Jam factor (0-10) */
    jamFactor?: number
  }
  /** Gate/barrier present */
  gates?: boolean
  /** Railway crossing present */
  railwayCrossings?: boolean
  /** Incident indices (references to section.incidents array) */
  incidents?: number[]
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
    /** Base duration without traffic */
    baseDuration?: number
    /** Typical duration */
    typicalDuration?: number
  }
  /** Transport mode used */
  transport: {
    mode: string
  }
  /** Actions/maneuvers (if requested) */
  actions?: RouteAction[]
  /** Turn-by-turn actions (if requested) */
  turnByTurnActions?: RouteAction[]
  /** Traffic incidents (if requested) */
  incidents?: RouteIncident[]
  /** Span data (if requested) */
  spans?: RouteSpan[]
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

/** Return types for route response */
export type RouteReturnType =
  | 'polyline'
  | 'summary'
  | 'typicalDuration'
  | 'turnByTurnActions'
  | 'incidents'

/** Span types for detailed segment data */
export type RouteSpanType =
  | 'dynamicSpeedInfo'
  | 'functionalClass'
  | 'gates'
  | 'railwayCrossings'
  | 'incidents'

export interface RoutingOptions {
  /** Origin coordinates */
  origin: RoutePoint
  /** Destination coordinates */
  destination: RoutePoint
  /** Transport mode (defaults to 'car') */
  transportMode?: 'car' | 'truck' | 'pedestrian' | 'bicycle' | 'scooter'
  /** Return types - what data to include in response */
  return?: RouteReturnType[]
  /** Span types - what segment-level data to include */
  spans?: RouteSpanType[]
  /** Departure time (ISO 8601 string or 'any') */
  departureTime?: string
  /** Number of alternative routes to calculate (0-6) */
  alternatives?: number
  /** Areas/features to avoid */
  avoid?: {
    /** Features to avoid (e.g., 'tollRoad', 'ferry', 'tunnel') */
    features?: string[]
    /** Bounding boxes to avoid (format: 'bbox:west,south,east,north') */
    areas?: string[]
  }
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
    spans: spanTypes,
    departureTime = 'any',
    alternatives = 0,
    avoid,
  } = options

  const routingParams: H.service.RoutingService8.CalculateRouteParams = {
    routingMode: 'fast',
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
