import type { FlowItem, FlowResponse, TrafficFlowData } from '@/entities'
import type { PrioritizedSegment } from '@/entities/traffic'

import { extractSegmentId } from './segment-parser'

/**
 * Check if traffic flow exceeds jam factor threshold
 * jamFactor: 0 = free flow, 10 = standstill
 */
function isJammed(flow: Pick<TrafficFlowData, 'jamFactor'>, jamThreshold: number): boolean {
  return flow.jamFactor >= jamThreshold
}

/**
 * Calculate priority based on distance from middle
 * Edge segments = higher priority (kept first)
 * Middle segments = priority 0 (removed first when limiting)
 */
const calculatePriority = (index: number, totalCount: number): number =>
  Math.floor(Math.abs(index - (totalCount - 1) / 2))

/**
 * Determine data source based on confidence score
 */
function getDataSource(confidence: number): 'realtime' | 'historical' | 'speedLimit' {
  if (confidence > 0.7) return 'realtime'
  if (confidence > 0.5) return 'historical'
  return 'speedLimit'
}

/**
 * Convert a segment ref to a PrioritizedSegment
 */
function toPrioritizedSegment(
  seg: { ref: string },
  index: number,
  total: number,
  confidence: number,
  flow: { speed: number; jamFactor: number; length: number; freeFlow: number },
  points?: { lat: number; lng: number }[],
): PrioritizedSegment | null {
  const segmentId = extractSegmentId(seg.ref)

  return segmentId
    ? {
        id: segmentId,
        priority: calculatePriority(index, total),
        dataSource: getDataSource(confidence),
        shape: points,
        length: flow.length,
        speed: flow.speed,
        freeFlow: flow.freeFlow,
        jamFactor: flow.jamFactor,
      }
    : null
}

/**
 * Map shape links to segments based on cumulative length.
 * Accesses shape links from the FlowItem's location property.
 */
function mapShapeToSegments(item: FlowItem): Map<number, { lat: number; lng: number }[]> {
  const segmentRefs = item.location.segmentRef?.segments
  const shapeLinks = item.location.shape?.links
  const map = new Map<number, { lat: number; lng: number }[]>()

  if (!segmentRefs || !shapeLinks) return map

  let linkIdx = 0
  let linkCumulative = 0

  // Iterate through each segment to find matching shape links
  for (let i = 0; i < segmentRefs.length; i++) {
    const seg = segmentRefs[i]!
    const segStart = linkCumulative // Approximation: aligned start
    const segEnd = segStart + seg.length
    const points: { lat: number; lng: number }[] = []

    // Collect links that overlap with this segment
    while (linkIdx < shapeLinks.length) {
      const link = shapeLinks[linkIdx]!

      points.push(...link.points)

      const len = link.length
      linkCumulative += len
      linkIdx++

      if (linkCumulative >= segEnd) break
    }
    map.set(i, points)
  }
  return map
}

/**
 * Extract segments with priority based on subsegment mapping.
 * Uses a single-pass rolling cumulative length approach.
 */
function extractPrioritizedSegments(item: FlowItem, jamThreshold: number): PrioritizedSegment[] {
  const segmentRefs = item.location.segmentRef?.segments
  if (!segmentRefs?.length) return []

  const subSegments = item.currentFlow.subSegments
  const hasSubSegments = subSegments && subSegments.length > 0

  // CASE 1: No subsegments OR all subsegments are jammed.
  // Return all segments with middle-out priority.
  const allJammed = !hasSubSegments || subSegments.every((sub) => isJammed(sub, jamThreshold))

  // Pre-calculate shape mapping
  const shapeMap = mapShapeToSegments(item)

  if (allJammed) {
    return segmentRefs
      .map((seg, i) =>
        toPrioritizedSegment(
          seg,
          i,
          segmentRefs.length,
          item.currentFlow.confidence,
          {
            speed: item.currentFlow.speed,
            jamFactor: item.currentFlow.jamFactor,
            length: seg.length,
            freeFlow: item.currentFlow.freeFlow,
          },
          shapeMap.get(i),
        ),
      )
      .filter((s): s is PrioritizedSegment => s !== null)
  }

  // CASE 2: Partial congestion. Single-pass rolling cumulative length approach.
  const results: PrioritizedSegment[] = []
  let segIdx = 0
  let segCumulative = 0

  for (const subSegment of subSegments) {
    const subEnd = segCumulative + subSegment.length
    const jammed = isJammed(subSegment, jamThreshold)
    const groupStartIdx = segIdx

    // Collect all segments that fall within this subsegment's length
    while (segIdx < segmentRefs.length) {
      const seg = segmentRefs[segIdx]!
      const segLength = seg.length ?? 0

      // If segment starts beyond this subsegment, break
      if (segCumulative >= subEnd) break

      if (jammed) {
        const groupSize = segIdx - groupStartIdx + 1
        const prioritized = toPrioritizedSegment(
          seg,
          segIdx - groupStartIdx,
          groupSize,
          subSegment.confidence,
          {
            speed: subSegment.speed,
            jamFactor: subSegment.jamFactor,
            length: segLength,
            freeFlow: subSegment.freeFlow,
          },
          shapeMap.get(segIdx), // Use the original index from segmentRefs
        )
        if (prioritized) results.push(prioritized)
      }

      segCumulative += segLength
      segIdx++
    }
  }

  return results
}

/**
 * Get congested segment IDs with directional modifiers for routing API
 */
export function getCongestedSegments(
  data: FlowResponse,
  jamThreshold: number,
): PrioritizedSegment[] {
  if (!data?.results) return []

  const segments: PrioritizedSegment[] = []

  for (const item of data.results) {
    if (!isJammed(item.currentFlow, jamThreshold)) continue
    segments.push(...extractPrioritizedSegments(item, jamThreshold))
  }

  return segments
}
