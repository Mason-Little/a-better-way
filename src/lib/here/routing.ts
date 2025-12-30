/**
 * HERE Routing API v8 Client
 * Simple routing module for the minimal baseline
 */

import { decodeToCoordinates } from './polyline'

const ROUTING_API_BASE = 'https://router.hereapi.com/v8/routes'

export interface RouteCoordinate {
  lat: number
  lng: number
}

export interface RouteResult {
  coordinates: RouteCoordinate[]
  encodedPolyline: string
  summary: {
    durationSeconds: number
    lengthMeters: number
  }
}

interface HereRouteSection {
  polyline: string
  summary: {
    duration: number
    length: number
  }
}

interface HereRoute {
  sections: HereRouteSection[]
}

interface HereRoutingResponse {
  routes: HereRoute[]
}

/**
 * Get a route between two points using HERE Routing API v8
 */
export async function getRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate
): Promise<RouteResult | null> {
  const apiKey = import.meta.env.VITE_HERE_API_KEY

  if (!apiKey || apiKey === 'your_here_api_key_here') {
    console.error('[Routing] HERE API key not configured')
    return null
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    transportMode: 'car',
    return: 'polyline,summary',
  })

  const url = `${ROUTING_API_BASE}?${params}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('[Routing] API error:', error)
      return null
    }

    const data: HereRoutingResponse = await response.json()

    if (!data.routes || data.routes.length === 0) {
      console.warn('[Routing] No routes found')
      return null
    }

    const route = data.routes[0]!
    const section = route.sections[0]!

    // Decode the polyline
    const coordinates = decodeToCoordinates(section.polyline)

    return {
      coordinates,
      encodedPolyline: section.polyline,
      summary: {
        durationSeconds: section.summary.duration,
        lengthMeters: section.summary.length,
      },
    }
  } catch (error) {
    console.error('[Routing] Failed to fetch route:', error)
    return null
  }
}
