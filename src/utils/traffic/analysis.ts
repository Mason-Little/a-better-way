/**
 * Traffic Analysis Utilities
 * Slowdown detection and traffic summary
 */

import type { RouteSection, Slowdown, TrafficSummary } from '@/entities'
import { decodePolyline } from '@/utils/geo'

/**
 * Find all slowdowns in a route section
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
