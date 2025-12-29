/**
 * TomTom Orbis API SDK
 * Custom wrapper for TomTom Orbis Maps API v2
 */

// ============================================================================
// Types
// ============================================================================

export type Coordinate = {
  latitude: number
  longitude: number
}

export type AvoidRectangle = {
  southWestCorner: Coordinate
  northEastCorner: Coordinate
}

export type RouteSummary = {
  lengthInMeters: number
  travelTimeInSeconds: number
  trafficDelayInSeconds: number
  trafficLengthInMeters: number
  departureTime?: string
  arrivalTime?: string
}

export type TrafficSection = {
  startPointIndex: number
  endPointIndex: number
  sectionType: 'TRAFFIC'
  delayInSeconds: number
  magnitudeOfDelay: number
  simpleCategory?: string
  effectiveSpeedInKmh?: number
}

export type LegSection = {
  startPointIndex: number
  endPointIndex: number
  sectionType: 'LEG'
  travelMode: string
}

export type RouteSection = TrafficSection | LegSection

export type RouteLeg = {
  summary: RouteSummary
  points: Coordinate[]
}

export type OrbisRoute = {
  summary: RouteSummary
  legs?: RouteLeg[]
  sections?: RouteSection[]
}

export type CalculateRouteOptions = {
  maxAlternatives?: number
  traffic?: 'live' | 'historical'
  routeType?: 'fast' | 'short' | 'efficient' | 'thrilling'
  travelMode?: 'car'
  avoidAreas?: {
    rectangles?: AvoidRectangle[]
  }
}

export type CalculateRouteResponse = {
  formatVersion: string
  routes: OrbisRoute[]
}

// ============================================================================
// API Client
// ============================================================================

const API_BASE = 'https://api.tomtom.com/maps/orbis/routing/calculateRoute'

let apiKey: string | null = null

/**
 * Initialize the TomTom SDK with your API key
 */
export function init(key: string): void {
  apiKey = key
}

/**
 * Get the configured API key
 */
function getApiKey(): string {
  if (!apiKey) {
    // Fallback to env variable
    const envKey = import.meta.env.VITE_TOM_TOM_KEY
    if (!envKey) {
      throw new Error('TomTom API key not configured. Call TomTom.init(key) first.')
    }
    return envKey
  }
  return apiKey
}

/**
 * Format coordinates for API: lat,lng:lat,lng
 */
function formatLocations(locations: Coordinate[]): string {
  return locations.map((loc) => `${loc.latitude},${loc.longitude}`).join(':')
}

/**
 * Calculate a route between locations
 */
export async function calculateRoute(
  locations: Coordinate[],
  options: CalculateRouteOptions = {}
): Promise<OrbisRoute[]> {
  if (locations.length < 2) {
    throw new Error('At least 2 locations required')
  }

  const {
    maxAlternatives = 0,
    traffic = 'live',
    routeType = 'fast',
    travelMode = 'car',
    avoidAreas,
  } = options

  const params = new URLSearchParams({
    key: getApiKey(),
    apiVersion: '2',
    traffic,
    routeType,
    travelMode,
    maxAlternatives: String(maxAlternatives),
    sectionType: 'traffic',
  })

  const url = `${API_BASE}/${formatLocations(locations)}/json?${params}`

  const fetchOptions: RequestInit = {
    headers: {
      'TomTom-Api-Version': '2',
    },
  }

  // Use POST if we have avoid areas
  if (avoidAreas) {
    fetchOptions.method = 'POST'
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/json',
    }
    fetchOptions.body = JSON.stringify({ avoidAreas })
  }

  const res = await fetch(url, fetchOptions)

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detailedError?.message ?? `HTTP ${res.status}`)
  }

  const data: CalculateRouteResponse = await res.json()

  return data.routes ?? []
}

/**
 * Helper to check if a route has traffic delays
 */
export function hasTrafficDelays(route: OrbisRoute): boolean {
  return (route.summary?.trafficDelayInSeconds ?? 0) > 0
}

/**
 * Helper to get traffic sections from a route
 */
export function getTrafficSections(route: OrbisRoute): TrafficSection[] {
  return (route.sections ?? []).filter((s): s is TrafficSection => s.sectionType === 'TRAFFIC')
}

/**
 * Helper to get all coordinates from a route
 */
export function getRouteCoordinates(route: OrbisRoute): Coordinate[] {
  return (route.legs ?? []).flatMap((leg) => leg.points ?? [])
}

/**
 * Helper to create avoid rectangles from traffic sections
 */
export function createAvoidRectanglesFromTraffic(
  route: OrbisRoute,
  bufferDegrees = 0.001
): AvoidRectangle[] {
  const coordinates = getRouteCoordinates(route)
  const trafficSections = getTrafficSections(route)

  return trafficSections
    .filter((section) => section.delayInSeconds > 0)
    .map((section) => {
      const startCoord = coordinates[section.startPointIndex]
      const endCoord = coordinates[section.endPointIndex]

      if (!startCoord || !endCoord) return null

      const minLat = Math.min(startCoord.latitude, endCoord.latitude)
      const maxLat = Math.max(startCoord.latitude, endCoord.latitude)
      const minLng = Math.min(startCoord.longitude, endCoord.longitude)
      const maxLng = Math.max(startCoord.longitude, endCoord.longitude)

      return {
        southWestCorner: {
          latitude: minLat - bufferDegrees,
          longitude: minLng - bufferDegrees,
        },
        northEastCorner: {
          latitude: maxLat + bufferDegrees,
          longitude: maxLng + bufferDegrees,
        },
      }
    })
    .filter((r): r is AvoidRectangle => r !== null)
}

// Default export for namespace-style usage
export default {
  init,
  calculateRoute,
  hasTrafficDelays,
  getTrafficSections,
  getRouteCoordinates,
  createAvoidRectanglesFromTraffic,
}
