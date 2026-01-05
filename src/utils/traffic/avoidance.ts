import type { AvoidanceResult, FlowResponse, TrafficAvoidanceOptions } from '@/entities'

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

    if (!location.shape?.links) continue

    const subSegments = currentFlow.subSegments
    const links = location.shape.links
    const segmentRefs = item.location.segmentRef?.segments

    links.forEach((link, index) => {
      if (!link.points || link.points.length < 2) return

      const flowSource = subSegments?.[index] ?? currentFlow
      const jamFactor = flowSource.jamFactor
      const speedReduction = calculateSpeedReduction(flowSource.speed, flowSource.freeFlow)

      const meetsJamThreshold = jamFactor >= jamFactorThreshold
      const meetsSpeedThreshold = speedReduction >= speedReductionThreshold

      if (meetsJamThreshold || meetsSpeedThreshold) {
        const ref = segmentRefs?.[index]?.ref ?? segmentRefs?.[0]?.ref
        if (ref && !result.segments.includes(ref)) {
          result.segments.push(ref)
        }
      }
    })
  }

  return result
}

export { getCongestedSegments }
