/**
 * Traffic Analysis Utilities
 * Simple check for traffic delays
 */

import type { Route } from '@/entities'

/**
 * Check if a route has significant traffic delay
 */
export function hasTraffic(route: Route, thresholdSeconds = 20): boolean {
  if (!route.sections) return false

  return route.sections.some((section) => {
    const { duration, baseDuration } = section.summary
    // Calculate delay: difference between current travel time and free-flow time
    const delay = duration - (baseDuration ?? duration)
    return delay > thresholdSeconds
  })
}
