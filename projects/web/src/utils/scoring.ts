import type { Route, RouteScore, RouteViolations, StopSign, TrafficSegment } from '@/entities'
import { decodePolyline, distance } from '@/utils/geo'
import { extractRouteSegmentIds } from '@/utils/segments'

/** Default time penalty per traffic segment intersection (in seconds) */
const TRAFFIC_PENALTY_SECONDS = 30

/** Default time penalty per stop sign (in seconds) */
const STOP_SIGN_PENALTY_SECONDS = 15

/** Maximum distance in meters for stop sign proximity matching */
const STOP_SIGN_PROXIMITY_METERS = 30

/** Count traffic segments from the GLOBAL store that the route passes through */
function countTrafficSegments(route: Route, allTrafficSegments: TrafficSegment[]): number {
  const routeSegmentIds = extractRouteSegmentIds(route)
  if (routeSegmentIds.size === 0) return 0

  let count = 0
  for (const trafficSeg of allTrafficSegments) {
    if (routeSegmentIds.has(trafficSeg.id)) {
      count++
    }
  }

  return count
}

/** Count stop signs from the GLOBAL store that are near the route */
function countStopSigns(route: Route, allStopSigns: StopSign[]): number {
  const polyline = route.sections[0]?.polyline
  if (!polyline || allStopSigns.length === 0) return 0

  const routePoints = decodePolyline(polyline)
  if (routePoints.length === 0) return 0

  let count = 0
  for (const sign of allStopSigns) {
    const signPoint = { lat: sign.lat, lng: sign.lng }
    const isNearRoute = routePoints.some(
      (point) => distance(point, signPoint) < STOP_SIGN_PROXIMITY_METERS,
    )
    if (isNearRoute) {
      count++
    }
  }

  return count
}

/** Parse bbox string to get bounds */
function parseBBox(areaStr: string): {
  west: number
  south: number
  east: number
  north: number
} | null {
  // Format: "bbox:west,south,east,north"
  const match = areaStr.match(/bbox:([\d.-]+),([\d.-]+),([\d.-]+),([\d.-]+)/)
  if (!match) return null
  const [, west, south, east, north] = match
  if (!west || !south || !east || !north) return null
  return {
    west: parseFloat(west),
    south: parseFloat(south),
    east: parseFloat(east),
    north: parseFloat(north),
  }
}

/** Check if a point is inside a bounding box */
function isPointInBBox(
  point: { lat: number; lng: number },
  bbox: { west: number; south: number; east: number; north: number },
): boolean {
  return (
    point.lat >= bbox.south &&
    point.lat <= bbox.north &&
    point.lng >= bbox.west &&
    point.lng <= bbox.east
  )
}

/** Check if route has a violation notice from HERE API */
function hasViolationNotice(route: Route): boolean {
  for (const section of route.sections) {
    if (section.notices?.some((n) => n.code === 'violatedBlockedRoad')) {
      return true
    }
  }
  return false
}

/**
 * Diagnose which inputAvoids were violated when API reports a violation.
 * This is only called when hasViolation is true.
 */
function diagnoseViolations(route: Route): RouteViolations {
  const violations: RouteViolations = { segments: [], areas: [] }

  const polyline = route.sections[0]?.polyline
  if (!polyline) return violations

  const routePoints = decodePolyline(polyline)
  if (routePoints.length === 0) return violations

  const routeSegmentIds = extractRouteSegmentIds(route)

  // Check which input segment avoids were violated
  for (const segmentId of route.inputAvoids?.segments ?? []) {
    if (routeSegmentIds.has(segmentId)) {
      violations.segments.push(segmentId)
      console.log(`[Scoring] Route ${route.id} violated segment avoid: ${segmentId}`)
    }
  }

  // Check which input area avoids were violated
  for (const areaStr of route.inputAvoids?.areas ?? []) {
    const bbox = parseBBox(areaStr)
    if (!bbox) continue

    const passesThrough = routePoints.some((point) => isPointInBBox(point, bbox))
    if (passesThrough) {
      violations.areas.push(areaStr)
      console.log(`[Scoring] Route ${route.id} violated area avoid: ${areaStr}`)
    }
  }

  return violations
}

/** Calculate the total time penalty in seconds */
function calculateTotalPenalty(trafficCount: number, stopSignCount: number): number {
  return trafficCount * TRAFFIC_PENALTY_SECONDS + stopSignCount * STOP_SIGN_PENALTY_SECONDS
}

/** Calculate the score for a single route based on GLOBAL traffic segments and stop signs */
export function scoreRoute(
  route: Route,
  trafficSegments: TrafficSegment[],
  stopSigns: StopSign[],
): { score: RouteScore; violations: RouteViolations } {
  // Count based on GLOBAL data from the store
  const trafficSegmentCount = countTrafficSegments(route, trafficSegments)
  const stopSignCount = countStopSigns(route, stopSigns)
  const total = calculateTotalPenalty(trafficSegmentCount, stopSignCount)

  // Check if HERE API reported a violation
  const hasViolation = hasViolationNotice(route)

  // Only diagnose specific violations if the API reported one
  const violations = hasViolation ? diagnoseViolations(route) : { segments: [], areas: [] }

  if (hasViolation) {
    console.log(`[Scoring] Route ${route.id} has violatedBlockedRoad notice from HERE API`)
  }

  return {
    score: {
      trafficSegmentCount,
      stopSignCount,
      total,
      hasViolation,
    },
    violations,
  }
}

/** Score all routes and return them with scores attached */
export function scoreRoutes(
  routes: Route[],
  trafficSegments: TrafficSegment[],
  stopSigns: StopSign[],
): Route[] {
  return routes.map((route) => {
    const { score, violations } = scoreRoute(route, trafficSegments, stopSigns)
    return { ...route, score, violations }
  })
}
