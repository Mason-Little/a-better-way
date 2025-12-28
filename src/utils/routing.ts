import { calculateRoute } from '@tomtom-org/maps-sdk/services'
import type { Route } from '@tomtom-org/maps-sdk/core'

type AvoidRectangle = {
  southWestCorner: { latitude: number; longitude: number }
  northEastCorner: { latitude: number; longitude: number }
}

const MAX_ROUTE_COUNT = 10
const ALTERNATIVES_PER_REQUEST = 5
const MAX_BATCHES = 5

/**
 * Check if a route has zero traffic delays.
 */
function hasNoDelays(route: Route): boolean {
  return route.properties.summary.trafficDelayInSeconds === 0
}

/**
 * Process a batch of routes, collecting them and extracting traffic rectangles.
 * Returns the updated state.
 */
function processBatch(
  routes: Route[],
  collectedRoutes: Route[],
  accumulatedRectangles: AvoidRectangle[],
  maxCount: number
): { routes: Route[]; rectangles: AvoidRectangle[]; foundNoDelay: boolean } {
  const newRoutes: Route[] = []
  const newRectangles: AvoidRectangle[] = []
  const hasFoundNoDelay = routes.some((route) => route && hasNoDelays(route))

  for (const route of routes) {
    if (!route || collectedRoutes.length + newRoutes.length >= maxCount) break

    newRoutes.push(route)

    if (!hasNoDelays(route)) {
      const rectangles = extractTrafficRectangles(route.geometry, route.properties)
      newRectangles.push(...rectangles)
    }
  }

  return {
    routes: [...collectedRoutes, ...newRoutes],
    rectangles: [...accumulatedRectangles, ...newRectangles],
    foundNoDelay: hasFoundNoDelay,
  }
}

/**
 * Get multiple route alternatives by batching requests.
 * Requests 5 alternatives per call, accumulating avoid areas from traffic sections.
 * Returns when either MAX_ROUTE_COUNT routes are collected or a route with no delay is found.
 */
export async function getRoute(
  start: [number, number],
  end: [number, number]
): Promise<Route[]> {
  try {
    // First batch - get initial 5 alternatives using SDK
    const response = await calculateRoute({
      apiKey: import.meta.env.VITE_TOM_TOM_KEY,
      locations: [start, end],
      maxAlternatives: ALTERNATIVES_PER_REQUEST,
    })

    if (!response.features || response.features.length === 0) {
      return []
    }

    const initialState = processBatch(response.features, [], [], MAX_ROUTE_COUNT)

    if (initialState.foundNoDelay) {
      return initialState.routes
    }

    // Recursively fetch more batches
    return fetchMoreBatches(start, end, initialState.routes, initialState.rectangles, 1)
  } catch (error) {
    console.error('Failed to calculate route:', error)
    return []
  }
}

/**
 * Recursively fetch more route batches until we hit limits or find a no-delay route.
 */
async function fetchMoreBatches(
  start: [number, number],
  end: [number, number],
  collectedRoutes: Route[],
  accumulatedRectangles: AvoidRectangle[],
  batchCount: number
): Promise<Route[]> {
  // Check termination conditions
  if (
    collectedRoutes.length >= MAX_ROUTE_COUNT ||
    accumulatedRectangles.length === 0 ||
    batchCount >= MAX_BATCHES
  ) {
    return collectedRoutes
  }

  await delay(1000)

  const newRoutes = await fetchRoutesWithAvoidAreas(
    start,
    end,
    accumulatedRectangles,
    collectedRoutes[0]!
  )

  if (newRoutes.length === 0) {
    return collectedRoutes
  }

  const state = processBatch(newRoutes, collectedRoutes, accumulatedRectangles, MAX_ROUTE_COUNT)

  if (state.foundNoDelay) {
    return state.routes
  }

  return fetchMoreBatches(start, end, state.routes, state.rectangles, batchCount + 1)
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
