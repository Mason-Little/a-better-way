/**
 * Traffic Incident Utilities
 * Located incident extraction from route data
 */

import type { LocatedIncident, RouteSection, RouteSpan } from '@/entities'
import { decodePolyline } from '@/utils/geo'

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
