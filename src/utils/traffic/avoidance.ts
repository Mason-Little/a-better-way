import type {
  AvoidanceResult,
  FlowResponse,
  SegmentRef,
  SubSegment,
  TrafficAvoidanceOptions,
} from '@/entities'

/**
 * Calculate the speed reduction ratio
 * Returns 0.0 to 1.0 (1.0 = stopped, 0.0 = free flow)
 */
function calculateSpeedReduction(speed: number, freeFlow: number): number {
  if (freeFlow <= 0) return 0
  if (speed >= freeFlow) return 0
  return 1 - speed / freeFlow
}

/**
 * Convert a compact segment ref to the full here:cm:segment format
 *
 * Traffic API returns refs like: "$0:314876278:$1:408017975#-0..1"
 * We need to extract the segment ID after $1: and convert to: "here:cm:segment:408017975"
 */
function convertSegmentRef(ref: string): string | null {
  const match = ref.match(/\$1:(\d+)/)
  if (!match || !match[1]) {
    console.warn(`[TrafficAvoidance] Could not extract segment ID from ref: ${ref}`)
    return null
  }
  return `here:cm:segment:${match[1]}`
}

/**
 * Check if a flow meets congestion thresholds
 */
function isFlowCongested(
  jamFactor: number,
  speed: number,
  freeFlow: number,
  jamFactorThreshold: number,
  speedReductionThreshold: number,
): boolean {
  const speedReduction = calculateSpeedReduction(speed, freeFlow)
  return jamFactor >= jamFactorThreshold || speedReduction >= speedReductionThreshold
}

/**
 * Map subSegments to segments using length calculations
 * Returns the indices of segments that overlap with congested subSegments
 */
function findCongestedSegmentIndices(
  segments: SegmentRef[],
  subSegments: SubSegment[],
  jamFactorThreshold: number,
  speedReductionThreshold: number,
): Set<number> {
  const congestedIndices = new Set<number>()

  let segmentIdx = 0
  let segmentStart = 0
  let subSegmentStart = 0

  for (const subSegment of subSegments) {
    const subSegmentEnd = subSegmentStart + subSegment.length
    const isCongested = isFlowCongested(
      subSegment.jamFactor,
      subSegment.speed,
      subSegment.freeFlow,
      jamFactorThreshold,
      speedReductionThreshold,
    )

    if (isCongested) {
      // Find all segments that overlap with this congested subSegment
      while (segmentIdx < segments.length) {
        const segment = segments[segmentIdx]
        if (!segment) break
        const segmentEnd = segmentStart + segment.length

        // Check if segment overlaps with current subSegment
        if (segmentStart < subSegmentEnd && segmentEnd > subSegmentStart) {
          congestedIndices.add(segmentIdx)
        }

        // Move to next segment if we've passed it
        if (segmentEnd <= subSegmentEnd) {
          segmentStart = segmentEnd
          segmentIdx++
        } else {
          break
        }
      }
    } else {
      // Skip past segments covered by this non-congested subSegment
      while (segmentIdx < segments.length) {
        const segment = segments[segmentIdx]
        if (!segment) break
        const segmentEnd = segmentStart + segment.length

        if (segmentEnd <= subSegmentEnd) {
          segmentStart = segmentEnd
          segmentIdx++
        } else {
          break
        }
      }
    }

    subSegmentStart = subSegmentEnd
  }

  return congestedIndices
}

/**
 * Generate avoid segments from traffic flow data based on thresholds
 */
function getCongestedSegments(
  data: FlowResponse,
  options: TrafficAvoidanceOptions,
): AvoidanceResult {
  const result: AvoidanceResult = { segments: [], areas: [] }

  if (!data?.results) return result

  const { jamFactorThreshold = 8, speedReductionThreshold = 0.5 } = options

  for (const item of data.results) {
    const { currentFlow, location } = item
    const segments = location.segmentRef?.segments

    if (!segments?.length) continue

    let segmentsToAvoid: SegmentRef[] = []

    if (currentFlow.subSegments?.length) {
      // Use precise mapping when subSegments are available
      const congestedIndices = findCongestedSegmentIndices(
        segments,
        currentFlow.subSegments,
        jamFactorThreshold,
        speedReductionThreshold,
      )

      segmentsToAvoid = segments.filter((_, idx) => congestedIndices.has(idx))

      if (congestedIndices.size > 0) {
        console.log(
          `[TrafficAvoidance] SubSegment mapping: ${congestedIndices.size}/${segments.length} segments congested`,
        )
      }
    } else {
      // No subSegments - check main flow only
      const mainFlowCongested = isFlowCongested(
        currentFlow.jamFactor,
        currentFlow.speed,
        currentFlow.freeFlow,
        jamFactorThreshold,
        speedReductionThreshold,
      )

      if (mainFlowCongested) {
        segmentsToAvoid = segments
      }
    }

    // Convert and add congested segments
    for (const segment of segmentsToAvoid) {
      const cmSegment = convertSegmentRef(segment.ref)
      if (cmSegment && !result.segments.includes(cmSegment)) {
        result.segments.push(cmSegment)
        console.log(`[TrafficAvoidance] Avoiding segment: ${cmSegment}`)
      }
    }
  }

  console.log(`[TrafficAvoidance] Total segments to avoid: ${result.segments.length}`)
  return result
}

export { getCongestedSegments }
