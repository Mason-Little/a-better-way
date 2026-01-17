/**
 * Traffic Segment Matcher
 * Match routes to traffic segments using segment reference IDs
 */

import type { PrioritizedSegment, Route } from '@/entities'

import { extractSegmentId } from './segment-parser'

/**
 * Find segments that match any of the given routes' segment references
 */
export function findMatchingSegments(
  segments: PrioritizedSegment[],
  routes: Route[],
): { matches: PrioritizedSegment[]; others: PrioritizedSegment[] } {
  // Build a set of all segment IDs from routes
  const routeSegmentIds = new Set<string>()

  for (const route of routes) {
    for (const section of route.sections ?? []) {
      for (const span of section.spans ?? []) {
        if (!span.segmentRef) continue

        const refs = Array.isArray(span.segmentRef) ? span.segmentRef : [span.segmentRef]
        for (const ref of refs) {
          const id = extractSegmentId(ref)
          if (id) routeSegmentIds.add(id)
        }
      }
    }
  }

  // Partition traffic segments into matches vs others
  const matches: PrioritizedSegment[] = []
  const others: PrioritizedSegment[] = []

  for (const segment of segments) {
    if (routeSegmentIds.has(segment.id)) {
      matches.push(segment)
    } else {
      others.push(segment)
    }
  }

  return { matches, others }
}
