import type { FlowItem, FlowResponse } from '@/entities'
import type { PrioritizedSegment } from '@/entities/traffic'
import { isSlowed } from '@/utils/traffic/slowdown'

import { expandSegmentRef, extractSegmentId } from './segment-parser'

/**
 * Calculate priority based on distance from middle
 * Edge segments = higher priority (kept first)
 * Middle segments = priority 0 (removed first when limiting)
 */
const calculatePriority = (index: number, totalCount: number): number =>
  Math.floor(Math.abs(index - (totalCount - 1) / 2))

/**
 * Convert a segment ref to a PrioritizedSegment
 */
function toPrioritizedSegment(
  seg: { ref: string },
  index: number,
  total: number,
  refReplacements?: Record<string, string>,
): PrioritizedSegment | null {
  const expandedRef = expandSegmentRef(seg.ref, refReplacements)
  const segmentId = extractSegmentId(expandedRef)

  return segmentId ? { id: segmentId, priority: calculatePriority(index, total) } : null
}

/**
 * Extract segments with priority based on subsegment mapping.
 * Uses a single-pass rolling cumulative length approach.
 */
function extractPrioritizedSegments(
  item: FlowItem,
  refReplacements: Record<string, string>,
  slowdownThreshold: number,
): PrioritizedSegment[] {
  const segmentRefs = item.location.segmentRef?.segments
  if (!segmentRefs?.length) return []

  const subSegments = item.currentFlow.subSegments
  const hasSubSegments = subSegments && subSegments.length > 0

  // CASE 1: No subsegments OR all subsegments are jammed.
  // Return all segments with middle-out priority.
  const allJammed = !hasSubSegments || subSegments.every((sub) => isSlowed(sub, slowdownThreshold))

  if (allJammed) {
    return segmentRefs
      .map((seg, i) => toPrioritizedSegment(seg, i, segmentRefs.length, refReplacements))
      .filter((s): s is PrioritizedSegment => s !== null)
  }

  // CASE 2: Partial congestion. Single-pass rolling cumulative length approach.
  const results: PrioritizedSegment[] = []
  let segIdx = 0
  let segCumulative = 0

  for (const subSegment of subSegments) {
    const subEnd = segCumulative + subSegment.length
    const isJammed = isSlowed(subSegment, slowdownThreshold)
    const groupStartIdx = segIdx

    // Collect all segments that fall within this subsegment's length
    while (segIdx < segmentRefs.length) {
      const seg = segmentRefs[segIdx]!
      const segLength = seg.length ?? 0

      // If segment starts beyond this subsegment, break
      if (segCumulative >= subEnd) break

      if (isJammed) {
        const groupSize = segIdx - groupStartIdx + 1
        const prioritized = toPrioritizedSegment(
          seg,
          segIdx - groupStartIdx,
          groupSize,
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
  slowdownThreshold: number,
): PrioritizedSegment[] {
  if (!data?.results) return []

  const refReplacements = data.refReplacements
  const segments: PrioritizedSegment[] = []

  for (const item of data.results) {
    const slowed = isSlowed(item.currentFlow, slowdownThreshold)
    if (!slowed) continue
    segments.push(...extractPrioritizedSegments(item, refReplacements, slowdownThreshold))
  }

  return segments
}
