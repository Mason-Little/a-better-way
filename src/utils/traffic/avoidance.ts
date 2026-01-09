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

  if (!segmentId) {
    console.log('[DEBUG] toPrioritizedSegment failed to extract ID', {
      ref: seg.ref,
      expandedRef,
      segmentId,
    })
  } else {
    // console.log('[DEBUG] toPrioritizedSegment success', { segmentId })
  }

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
  console.log('[DEBUG] extractPrioritizedSegments entry', {
    location: item.location,
    currentFlow: item.currentFlow,
  })
  const segmentRefs = item.location.segmentRef?.segments
  if (!segmentRefs?.length) {
    console.log('[DEBUG] No segment refs found')
    return []
  }

  const subSegments = item.currentFlow.subSegments
  const hasSubSegments = subSegments && subSegments.length > 0

  // CASE 1: No subsegments OR all subsegments are jammed.
  // Return all segments with middle-out priority.
  const allJammed = !hasSubSegments || subSegments.every((sub) => isSlowed(sub, slowdownThreshold))
  console.log('[DEBUG] Logic check', { hasSubSegments, allJammed })

  if (allJammed) {
    console.log('[DEBUG] Case 1: All jammed')
    const result = segmentRefs
      .map((seg, i) => toPrioritizedSegment(seg, i, segmentRefs.length, refReplacements))
      .filter((s): s is PrioritizedSegment => s !== null)
    console.log('[DEBUG] Case 1 result:', result)
    return result
  }

  // CASE 2: Partial congestion. Single-pass rolling cumulative length approach.
  console.log('[DEBUG] Case 2: Partial congestion')
  const results: PrioritizedSegment[] = []
  let segIdx = 0
  let segCumulative = 0

  for (const subSegment of subSegments) {
    const subEnd = segCumulative + subSegment.length
    const isJammed = isSlowed(subSegment, slowdownThreshold)
    const groupStartIdx = segIdx

    console.log('[DEBUG] Processing subsegment', {
      subSegment,
      subEnd,
      isJammed,
      segIdxStart: segIdx,
      segCumulativeStart: segCumulative,
    })

    // Collect all segments that fall within this subsegment's length
    while (segIdx < segmentRefs.length) {
      const seg = segmentRefs[segIdx]!
      const segLength = seg.length ?? 0

      console.log(`[DEBUG] checking segment idx=${segIdx} len=${segLength} cum=${segCumulative}`)

      // If segment starts beyond this subsegment, break
      if (segCumulative >= subEnd) {
        console.log('[DEBUG] Break: segCumulative >= subEnd')
        break
      }

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

  console.log('[DEBUG] Case 2 results:', results)
  return results
}

/**
 * Get congested segment IDs with directional modifiers for routing API
 */
export function getCongestedSegments(
  data: FlowResponse,
  slowdownThreshold: number,
): PrioritizedSegment[] {
  console.log('[DEBUG] getCongestedSegments entry', { dataLength: data?.results?.length })
  if (!data?.results) return []

  const refReplacements = data.refReplacements

  const segments: PrioritizedSegment[] = []

  for (const item of data.results) {
    const slowed = isSlowed(item.currentFlow, slowdownThreshold)
    console.log('[DEBUG] Checking item slow status:', { slowed, flow: item.currentFlow })
    if (!slowed) continue
    segments.push(...extractPrioritizedSegments(item, refReplacements, slowdownThreshold))
  }

  console.log('[DEBUG] getCongestedSegments returning', segments.length, 'segments')
  return segments
}
