import type { FlowItem, FlowResponse, TrafficFlowData } from '@/entities'
import type { PrioritizedSegment } from '@/entities/traffic'

import { expandSegmentRef, extractSegmentId } from './segment-parser'

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
  refReplacements?: Record<string, string>,
): PrioritizedSegment | null {
  const expandedRef = expandSegmentRef(seg.ref, refReplacements)
  const segmentId = extractSegmentId(expandedRef)

  return segmentId
    ? {
        id: segmentId,
        priority: calculatePriority(index, total),
        dataSource: getDataSource(confidence),
      }
    : null
}

/**
 * Extract segments with priority based on subsegment mapping.
 * Uses a single-pass rolling cumulative length approach.
 */
function extractPrioritizedSegments(
  item: FlowItem,
  refReplacements: Record<string, string>,
  jamThreshold: number,
): PrioritizedSegment[] {
  const segmentRefs = item.location.segmentRef?.segments
  if (!segmentRefs?.length) return []

  const subSegments = item.currentFlow.subSegments
  const hasSubSegments = subSegments && subSegments.length > 0

  // CASE 1: No subsegments OR all subsegments are jammed.
  // Return all segments with middle-out priority.
  const allJammed = !hasSubSegments || subSegments.every((sub) => isJammed(sub, jamThreshold))

  if (allJammed) {
    return segmentRefs
      .map((seg, i) =>
        toPrioritizedSegment(
          seg,
          i,
          segmentRefs.length,
          item.currentFlow.confidence,
          refReplacements,
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
          refReplacements,
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

  const refReplacements = data.refReplacements
  const segments: PrioritizedSegment[] = []

  for (const item of data.results) {
    if (!isJammed(item.currentFlow, jamThreshold)) continue
    segments.push(...extractPrioritizedSegments(item, refReplacements, jamThreshold))
  }

  return segments
}
