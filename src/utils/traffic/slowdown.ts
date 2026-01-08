/**
 * Calculate slowdown ratio from current speed vs free flow speed
 * Returns 0 = free flow, 1 = stopped
 */

import type { TrafficFlowData } from '@/entities'

function getSlowdownRatio(speed: number, freeFlow: number): number {
  if (freeFlow <= 0) return 0
  if (speed >= freeFlow) return 0
  return 1 - speed / freeFlow
}

export function isSlowed(
  flow: Pick<TrafficFlowData, 'speed' | 'freeFlow'>,
  threshold = 0.5,
): boolean {
  return getSlowdownRatio(flow.speed, flow.freeFlow) >= threshold
}
