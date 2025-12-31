/**
 * Traffic analysis utilities for HERE route data
 */

import { decode } from '@here/flexpolyline'
import type { RouteSection, RouteSpan, RouteIncident, RoutePoint } from '@/lib/here-sdk/route'

/** A detected slowdown on the route */
export interface Slowdown {
  /** Location of the slowdown */
  location: RoutePoint
  /** Offset in polyline */
  offset: number
  /** Current traffic speed in m/s */
  trafficSpeed: number
  /** Normal speed without traffic in m/s */
  baseSpeed: number
  /** Slowdown as percentage (0-1, e.g., 0.3 = 30% slower) */
  slowdownPercent: number
  /** Road class (1=highway, 5=local) */
  functionalClass?: number
}

/** An incident with its location */
export interface LocatedIncident extends RouteIncident {
  /** Location of the incident */
  location: RoutePoint
  /** Offset in polyline */
  offset: number
}

/** Traffic summary for a route */
export interface TrafficSummary {
  /** Total delay in seconds */
  delaySeconds: number
  /** Whether there's significant traffic */
  hasTraffic: boolean
  /** Number of slowdown segments */
  slowdownCount: number
  /** Number of incidents */
  incidentCount: number
  /** Worst slowdown percentage (0-1) */
  worstSlowdown: number
}

/**
 * Decode HERE flexible polyline to array of points
 */
export function decodePolyline(polyline: string): RoutePoint[] {
  const result = decode(polyline)
  return result.polyline
    .filter((coords): coords is [number, number] | [number, number, number] =>
      coords[0] !== undefined && coords[1] !== undefined
    )
    .map((coords) => ({ lat: coords[0], lng: coords[1] }))
}

/**
 * Find all slowdowns in a route section
 * @param section The route section to analyze
 * @param threshold Minimum slowdown to detect (0-1, default 0.2 = 20% slower)
 */
export function findSlowdowns(section: RouteSection, threshold = 0.2): Slowdown[] {
  if (!section.spans || !section.polyline) return []

  const points = decodePolyline(section.polyline)
  const slowdowns: Slowdown[] = []

  for (const span of section.spans) {
    const { trafficSpeed, baseSpeed } = span.dynamicSpeedInfo ?? {}
    if (!trafficSpeed || !baseSpeed || baseSpeed === 0) continue

    const slowdownPercent = 1 - trafficSpeed / baseSpeed
    if (slowdownPercent >= threshold) {
      const point = points[span.offset]
      if (point) {
        slowdowns.push({
          location: point,
          offset: span.offset,
          trafficSpeed,
          baseSpeed,
          slowdownPercent,
          functionalClass: span.functionalClass,
        })
      }
    }
  }

  return slowdowns
}

/**
 * Get incidents with their locations from a route section
 * Requires spans=incidents in the API request
 */
export function getLocatedIncidents(section: RouteSection): LocatedIncident[] {
  if (!section.incidents || !section.spans || !section.polyline) return []

  const points = decodePolyline(section.polyline)
  const locatedIncidents: LocatedIncident[] = []

  // Find spans that reference incidents
  for (const span of section.spans) {
    const incidentIndices = (span as RouteSpan & { incidents?: number[] }).incidents
    if (!incidentIndices?.length) continue

    const point = points[span.offset]
    if (!point) continue

    for (const idx of incidentIndices) {
      const incident = section.incidents[idx]
      if (incident) {
        locatedIncidents.push({
          ...incident,
          location: point,
          offset: span.offset,
        })
      }
    }
  }

  return locatedIncidents
}

/**
 * Get a traffic summary for a route section
 */
export function getTrafficSummary(section: RouteSection): TrafficSummary {
  const { duration, baseDuration } = section.summary
  const delaySeconds = duration - (baseDuration ?? duration)

  const slowdowns = findSlowdowns(section, 0.1) // 10% threshold for counting
  const worstSlowdown = slowdowns.length > 0
    ? Math.max(...slowdowns.map((s) => s.slowdownPercent))
    : 0

  return {
    delaySeconds,
    hasTraffic: delaySeconds > 60 || slowdowns.length > 0, // >1 min delay or any slowdowns
    slowdownCount: slowdowns.length,
    incidentCount: section.incidents?.length ?? 0,
    worstSlowdown,
  }
}

/**
 * Convert m/s to mph
 */
export function msToMph(metersPerSecond: number): number {
  return metersPerSecond * 2.23694
}

/**
 * Convert m/s to km/h
 */
export function msToKmh(metersPerSecond: number): number {
  return metersPerSecond * 3.6
}

/** A bounding box avoid zone for routing */
export interface AvoidZone {
  /** North latitude */
  north: number
  /** South latitude */
  south: number
  /** East longitude */
  east: number
  /** West longitude */
  west: number
}

/** Options for generating avoid zones */
export interface AvoidZoneOptions {
  /** Radius around the point in meters (default: 500) */
  radiusMeters?: number
  /** Only include slowdowns worse than this (0-1, default: 0.3 = 30%) */
  slowdownThreshold?: number
  /** Include incidents in avoid zones (default: true) */
  includeIncidents?: boolean
  /** Include slowdowns in avoid zones (default: true) */
  includeSlowdowns?: boolean
}

/**
 * Create a bounding box around a point
 * @param point Center point
 * @param radiusMeters Radius in meters
 */
export function createBoundingBox(point: RoutePoint, radiusMeters: number): AvoidZone {
  // Approximate degrees per meter (varies by latitude, but close enough for small radii)
  const latDegPerMeter = 1 / 111320
  const lngDegPerMeter = 1 / (111320 * Math.cos((point.lat * Math.PI) / 180))

  const latOffset = radiusMeters * latDegPerMeter
  const lngOffset = radiusMeters * lngDegPerMeter

  return {
    north: point.lat + latOffset,
    south: point.lat - latOffset,
    east: point.lng + lngOffset,
    west: point.lng - lngOffset,
  }
}

/**
 * Generate avoid zones from traffic issues in a route section
 * These can be passed to a subsequent routing request to find alternative routes
 */
export function generateAvoidZones(
  section: RouteSection,
  options: AvoidZoneOptions = {}
): AvoidZone[] {
  const {
    radiusMeters = 500,
    slowdownThreshold = 0.3,
    includeIncidents = true,
    includeSlowdowns = true,
  } = options

  const zones: AvoidZone[] = []
  const addedPoints = new Set<string>() // Prevent duplicates

  // Add zones for slowdowns
  if (includeSlowdowns) {
    const slowdowns = findSlowdowns(section, slowdownThreshold)
    for (const slowdown of slowdowns) {
      const key = `${slowdown.location.lat.toFixed(5)},${slowdown.location.lng.toFixed(5)}`
      if (!addedPoints.has(key)) {
        addedPoints.add(key)
        zones.push(createBoundingBox(slowdown.location, radiusMeters))
      }
    }
  }

  // Add zones for incidents
  if (includeIncidents) {
    const incidents = getLocatedIncidents(section)
    for (const incident of incidents) {
      const key = `${incident.location.lat.toFixed(5)},${incident.location.lng.toFixed(5)}`
      if (!addedPoints.has(key)) {
        addedPoints.add(key)
        zones.push(createBoundingBox(incident.location, radiusMeters))
      }
    }
  }

  return zones
}

/**
 * Format avoid zones for HERE Routing API
 * Returns a string array for the avoid[areas] parameter
 */
export function formatAvoidZonesForApi(zones: AvoidZone[]): string[] {
  return zones.map(
    (z) => `bbox:${z.west},${z.south},${z.east},${z.north}`
  )
}

/**
 * Merge overlapping avoid zones to reduce complexity
 */
export function mergeOverlappingZones(zones: AvoidZone[]): AvoidZone[] {
  if (zones.length <= 1) return zones

  // Sort by south latitude
  const sorted = [...zones].sort((a, b) => a.south - b.south)
  const merged: AvoidZone[] = []

  let current = sorted[0]!
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]!
    // Check if zones overlap
    if (
      next.south <= current.north &&
      next.west <= current.east &&
      next.east >= current.west
    ) {
      // Merge
      current = {
        north: Math.max(current.north, next.north),
        south: Math.min(current.south, next.south),
        east: Math.max(current.east, next.east),
        west: Math.min(current.west, next.west),
      }
    } else {
      merged.push(current)
      current = next
    }
  }
  merged.push(current)

  return merged
}
