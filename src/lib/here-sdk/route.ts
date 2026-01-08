/**
 * HERE Maps Routing Service
 * Direct API wrapper for route calculation using POST requests
 */

import type { RoutingOptions, RoutingResult } from '@/entities'
import { env } from '@/lib/environment'

type RoutingRequestBody = {
  avoid?: {
    segments?: string[]
    areas?: string[]
    features?: string[]
  }
}

/** Calculate a route between two points using HERE Routing API v8 */
export async function calculateRoute(options: RoutingOptions): Promise<RoutingResult> {
  const {
    origin,
    destination,
    routingMode = 'fast',
    transportMode = 'car',
    return: returnTypes = ['polyline', 'summary'],
    spans: spanTypes,
    departureTime,
    alternatives = 0,
    avoid,
    via,
  } = options

  const url = new URL(env.VITE_ROUTING_BASE_URL)

  // Add query parameters
  url.searchParams.set('apiKey', env.VITE_HERE_API_KEY)
  url.searchParams.set('origin', `${origin.lat},${origin.lng}`)
  url.searchParams.set('destination', `${destination.lat},${destination.lng}`)
  url.searchParams.set('routingMode', routingMode)
  url.searchParams.set('transportMode', transportMode)
  url.searchParams.set('return', returnTypes.join(','))

  if (alternatives > 0) {
    url.searchParams.set('alternatives', alternatives.toString())
  }

  if (spanTypes?.length) {
    url.searchParams.set('spans', spanTypes.join(','))
  }

  if (departureTime) {
    url.searchParams.set('departureTime', departureTime)
  }

  if (via?.length) {
    via.forEach((point) => {
      url.searchParams.append('via', `${point.lat},${point.lng}!passThrough=true`)
    })
  }

  const body: RoutingRequestBody = {}

  if (avoid) {
    body.avoid = {}

    if (avoid.segments?.length) {
      body.avoid.segments = avoid.segments
    }

    if (avoid.areas?.length) {
      body.avoid.areas = avoid.areas
    }

    if (avoid.features?.length) {
      body.avoid.features = avoid.features
    }
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[RouteAPI] Request failed:', res.status, errorText)
      throw new Error(`Routing request failed: ${res.status}`)
    }

    const result = (await res.json()) as RoutingResult

    return result
  } catch (error) {
    console.error('[RouteAPI] Error calculating route:', error)
    throw error
  }
}
