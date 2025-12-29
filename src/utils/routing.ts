/**
 * Route calculation with traffic avoidance
 * Uses our custom TomTom SDK wrapper
 */

import type { Route } from '@tomtom-org/maps-sdk/core'
import TomTom, {
  type AvoidRectangle,
  type Coordinate,
  type OrbisRoute,
} from './tomtom'

const MAX_ROUTE_COUNT = 10
const ALTERNATIVES_PER_REQUEST = 5
const MAX_BATCHES = 5

/**
 * Convert our SDK route format to TomTom Maps SDK Route format
 * (needed for RoutingModule.showRoutes())
 */
function toSdkRoute(route: OrbisRoute, index: number): Route {
  const coordinates = TomTom.getRouteCoordinates(route).map(
    (c) => [c.longitude, c.latitude] as [number, number]
  )

  const trafficSections = TomTom.getTrafficSections(route).map((s) => ({
    startPointIndex: s.startPointIndex,
    endPointIndex: s.endPointIndex,
    delayInSeconds: s.delayInSeconds,
    magnitudeOfDelay: s.magnitudeOfDelay,
    simpleCategory: s.simpleCategory,
    effectiveSpeedInKmh: s.effectiveSpeedInKmh,
  }))

  const legSections = [
    {
      startPointIndex: 0,
      endPointIndex: Math.max(0, coordinates.length - 1),
      sectionType: 'LEG',
      travelMode: 'car',
    },
  ]

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates,
    },
    properties: {
      summary: {
        lengthInMeters: route.summary?.lengthInMeters ?? 0,
        travelTimeInSeconds: route.summary?.travelTimeInSeconds ?? 0,
        trafficDelayInSeconds: route.summary?.trafficDelayInSeconds ?? 0,
        trafficLengthInMeters: route.summary?.trafficLengthInMeters ?? 0,
        departureTime: route.summary?.departureTime,
        arrivalTime: route.summary?.arrivalTime,
      },
      sections: {
        traffic: trafficSections,
        leg: legSections,
      },
      index,
    },
  } as unknown as Route
}

/**
 * Process a batch of routes, collecting them and extracting traffic rectangles
 */
function processBatch(
  routes: OrbisRoute[],
  collectedRoutes: OrbisRoute[],
  accumulatedRectangles: AvoidRectangle[],
  maxCount: number
): { routes: OrbisRoute[]; rectangles: AvoidRectangle[]; foundNoDelay: boolean } {
  const newRoutes: OrbisRoute[] = []
  const newRectangles: AvoidRectangle[] = []
  const hasFoundNoDelay = routes.some((route) => route && !TomTom.hasTrafficDelays(route))

  for (const route of routes) {
    if (!route || collectedRoutes.length + newRoutes.length >= maxCount) break

    newRoutes.push(route)

    if (TomTom.hasTrafficDelays(route)) {
      const rectangles = TomTom.createAvoidRectanglesFromTraffic(route)
      newRectangles.push(...rectangles)
    }
  }

  return {
    routes: [...collectedRoutes, ...newRoutes],
    rectangles: [...accumulatedRectangles, ...newRectangles],
    foundNoDelay: hasFoundNoDelay,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Recursively fetch more route batches until we hit limits or find a no-delay route
 */
async function fetchMoreBatches(
  start: Coordinate,
  end: Coordinate,
  collectedRoutes: OrbisRoute[],
  accumulatedRectangles: AvoidRectangle[],
  batchCount: number
): Promise<OrbisRoute[]> {
  if (
    collectedRoutes.length >= MAX_ROUTE_COUNT ||
    accumulatedRectangles.length === 0 ||
    batchCount >= MAX_BATCHES
  ) {
    return collectedRoutes
  }

  await delay(1000)

  const newRoutes = await TomTom.calculateRoute([start, end], {
    maxAlternatives: ALTERNATIVES_PER_REQUEST,
    traffic: 'live',
    avoidAreas: {
      rectangles: accumulatedRectangles.slice(0, 10), // API limit
    },
  })

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
 * Get multiple route alternatives by batching requests.
 * Uses TomTom Orbis API v2 via our custom SDK.
 * Requests 5 alternatives per call, accumulating avoid areas from traffic sections.
 * Returns when either MAX_ROUTE_COUNT routes are collected or a route with no delay is found.
 */
export async function getRoute(start: [number, number], end: [number, number]): Promise<Route[]> {
  try {
    const startCoord: Coordinate = { latitude: start[1], longitude: start[0] }
    const endCoord: Coordinate = { latitude: end[1], longitude: end[0] }

    // First batch - get initial alternatives
    const initialRoutes = await TomTom.calculateRoute([startCoord, endCoord], {
      maxAlternatives: ALTERNATIVES_PER_REQUEST,
      traffic: 'live',
    })

    if (initialRoutes.length === 0) {
      return []
    }

    const initialState = processBatch(initialRoutes, [], [], MAX_ROUTE_COUNT)

    let allRoutes: OrbisRoute[]

    if (initialState.foundNoDelay) {
      allRoutes = initialState.routes
    } else {
      // Recursively fetch more batches with avoid areas
      allRoutes = await fetchMoreBatches(
        startCoord,
        endCoord,
        initialState.routes,
        initialState.rectangles,
        1
      )
    }

    // Convert to SDK format for RoutingModule compatibility
    return allRoutes.map((route, index) => toSdkRoute(route, index))
  } catch (error) {
    console.error('Failed to calculate route:', error)
    return []
  }
}
