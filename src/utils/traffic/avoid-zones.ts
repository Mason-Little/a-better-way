/**
 * Avoid Zone Utilities
 * Generate and manipulate avoid zones for routing
 */

import type { RouteSection, AvoidZone, AvoidZoneOptions } from '@/entities'
import { createBoundingBox } from '@/utils/geo'
import { findSlowdowns } from './analysis'
import { getLocatedIncidents } from './incidents'

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
