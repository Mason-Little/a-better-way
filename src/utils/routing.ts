import { calculateRoute } from '@tomtom-org/maps-sdk/services'
import type { Route } from '@tomtom-org/maps-sdk/core'

type AvoidRectangle = {
  southWestCorner: { latitude: number; longitude: number }
  northEastCorner: { latitude: number; longitude: number }
}

type RoutesCallback = (routes: Route[]) => void

const TARGET_ROUTE_COUNT = 10
const ALTERNATIVES_PER_REQUEST = 5

/**
 * Check if a route has zero traffic delays.
 */
function hasNoDelays(route: Route): boolean {
  return route.properties.summary.trafficDelayInSeconds === 0
}

/**
 * Get multiple route alternatives by batching requests.
 * Requests 5 alternatives per call, accumulating avoid areas from traffic sections,
 * until we have 10 total unique routes.
 */
export async function getRoute(
  start: [number, number],
  end: [number, number],
  onAllRoutesUpdate?: RoutesCallback
): Promise<Route | undefined> {
  const collectedRoutes: Route[] = []
  const accumulatedRectangles: AvoidRectangle[] = []

  try {
    // First batch - get initial 5 alternatives using SDK
    const response = await calculateRoute({
      apiKey: import.meta.env.VITE_TOM_TOM_KEY,
      locations: [start, end],
      maxAlternatives: ALTERNATIVES_PER_REQUEST,
    })

    if (!response.features || response.features.length === 0) {
      return undefined
    }

    // Add all routes from first batch
    let foundZeroDelayRoute = false
    for (const route of response.features) {
      if (route) {
        collectedRoutes.push(route)

        // Check if this route has no delays
        if (hasNoDelays(route)) {
          foundZeroDelayRoute = true
          break
        }

        // Extract traffic rectangles from this route
        const rectangles = extractTrafficRectangles(route.geometry, route.properties)
        accumulatedRectangles.push(...rectangles)
      }
    }

    // Notify about all routes so far
    if (onAllRoutesUpdate) {
      onAllRoutesUpdate([...collectedRoutes])
    }

    // Continue fetching batches until we have TARGET_ROUTE_COUNT routes or find a zero-delay route
    let batchNumber = 2
    while (!foundZeroDelayRoute && collectedRoutes.length < TARGET_ROUTE_COUNT && accumulatedRectangles.length > 0) {
      // Wait a bit between batches
      await delay(1000)

      const newRoutes = await fetchRoutesWithAvoidAreas(
        start,
        end,
        accumulatedRectangles,
        collectedRoutes[0]! // Use first route as template (guaranteed to exist)
      )

      if (newRoutes.length === 0) {
        break
      }

      for (const route of newRoutes) {
        // Check if we already have enough
        if (collectedRoutes.length >= TARGET_ROUTE_COUNT) break

        collectedRoutes.push(route)

        // Check if this route has no delays
        if (hasNoDelays(route)) {
          foundZeroDelayRoute = true
          break
        }

        // Extract more traffic rectangles
        const rectangles = extractTrafficRectangles(route.geometry, route.properties)
        accumulatedRectangles.push(...rectangles)
      }

      // Notify about all routes
      if (onAllRoutesUpdate) {
        onAllRoutesUpdate([...collectedRoutes])
      }

      batchNumber++

      // Safety limit on batches
      if (batchNumber > 5) {
        break
      }
    }

    return collectedRoutes[0]
  } catch (error) {
    console.error('Failed to calculate route:', error)
  }
  return undefined
}

/**
 * Fetch routes using direct API with avoid areas.
 */
async function fetchRoutesWithAvoidAreas(
  start: [number, number],
  end: [number, number],
  avoidRectangles: AvoidRectangle[],
  templateRoute: Route
): Promise<Route[]> {
  const apiKey = import.meta.env.VITE_TOM_TOM_KEY
  const locations = `${start[1]},${start[0]}:${end[1]},${end[0]}`
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${apiKey}&traffic=true&sectionType=traffic&maxAlternatives=${ALTERNATIVES_PER_REQUEST}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avoidAreas: {
          rectangles: avoidRectangles.slice(0, 10), // API limit of 10 rectangles
        },
      }),
    })

    const data = await res.json()

    if (!data.routes || data.routes.length === 0) {
      return []
    }

    // Convert all routes to SDK format
    return data.routes.map((apiRoute: any) => convertApiRouteToSdkFormat(apiRoute, templateRoute))
  } catch {
    return []
  }
}

/**
 * Extract bounding box rectangles from traffic sections.
 */
function extractTrafficRectangles(
  geometry: Route['geometry'],
  properties: Route['properties']
): AvoidRectangle[] {
  const rectangles: AvoidRectangle[] = []

  for (const section of properties.sections.traffic ?? []) {
    if (!section.delayInSeconds || section.delayInSeconds === 0) {
      continue
    }

    const startCoord = geometry.coordinates[section.startPointIndex] as [number, number]
    const endCoord = geometry.coordinates[section.endPointIndex] as [number, number]

    // Coordinates are [longitude, latitude] in GeoJSON
    const minLng = Math.min(startCoord[0], endCoord[0])
    const maxLng = Math.max(startCoord[0], endCoord[0])
    const minLat = Math.min(startCoord[1], endCoord[1])
    const maxLat = Math.max(startCoord[1], endCoord[1])

    // Add small buffer (~100m) to ensure the area is avoided
    const buffer = 0.001

    rectangles.push({
      southWestCorner: { latitude: minLat - buffer, longitude: minLng - buffer },
      northEastCorner: { latitude: maxLat + buffer, longitude: maxLng + buffer },
    })
  }

  return rectangles
}

/**
 * Convert raw API route to SDK-compatible format.
 */
function convertApiRouteToSdkFormat(apiRoute: any, templateRoute: Route): Route {
  return {
    ...templateRoute,
    geometry: {
      type: 'LineString',
      coordinates:
        apiRoute.legs?.[0]?.points?.map((p: any) => [p.longitude, p.latitude]) ??
        templateRoute.geometry.coordinates,
    },
    properties: {
      ...templateRoute.properties,
      summary: {
        ...templateRoute.properties.summary,
        lengthInMeters: apiRoute.summary?.lengthInMeters ?? templateRoute.properties.summary.lengthInMeters,
        travelTimeInSeconds:
          apiRoute.summary?.travelTimeInSeconds ?? templateRoute.properties.summary.travelTimeInSeconds,
        trafficDelayInSeconds: apiRoute.summary?.trafficDelayInSeconds ?? 0,
      },
    },
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
