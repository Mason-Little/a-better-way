import type { Route, RouteAction, RoutePoint, StopSignResult } from '@/entities'
import { useAvoidanceStore } from '@/stores/avoidanceStore'
import {
  calculateBearing,
  createBoundingBox,
  decodePolyline,
  getBoundingBoxKey,
  getPointBehind,
  isPointInBoundingBox,
} from '@/utils/geo'

// ─────────────────────────────────────────────────────────────────────────────
// Turn Detection Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isSharpLeftTurn(action: RouteAction): boolean {
  return (
    action.action === 'turn' &&
    action.direction === 'left' &&
    action.turnAngle !== undefined &&
    Math.abs(action.turnAngle) > 60
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stop Sign Detection
// ─────────────────────────────────────────────────────────────────────────────

async function checkForStopSignAtPoint(point: RoutePoint, heading: number): Promise<boolean> {
  const { detectStopSignCached } = useAvoidanceStore()
  return await detectStopSignCached(point, heading)
}

async function findStopSignsForRoute(route: Route): Promise<StopSignResult[]> {
  const polylinePoints = decodePolyline(route.sections[0]?.polyline ?? '')
  const turnByTurnActions = route.sections[0]?.turnByTurnActions
  const stopSignResults: StopSignResult[] = []
  const { stopSignBoxes } = useAvoidanceStore()

  if (!turnByTurnActions) return []

  const checkPromises = turnByTurnActions.map(async (action, index) => {
    if (isSharpLeftTurn(action)) {
      const turnPoint = polylinePoints[action.offset]

      // valid point check
      if (!turnPoint) return null

      // Check if we already have a stop sign at this location (avoid redundant API calls)
      const isKnown = stopSignBoxes.value.some((box) => isPointInBoundingBox(turnPoint, box))
      if (isKnown) return null

      const lastPoint = polylinePoints[action.offset - 1]
      if (!lastPoint) return null

      const heading = calculateBearing(turnPoint, lastPoint)
      const offsetPoint = getPointBehind(turnPoint, heading, 40)
      if (!offsetPoint) return null

      const stopSign = await checkForStopSignAtPoint(offsetPoint, heading)
      if (stopSign) {
        return { avoidZone: createBoundingBox(turnPoint, 20), actionIndex: index }
      }
    }
    return null
  })

  const results = await Promise.all(checkPromises)

  results.forEach((result) => {
    if (result) stopSignResults.push(result)
  })

  return stopSignResults
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find stop signs across multiple routes
 * Deduplicates results by bounding box center point
 */
export async function findStopSigns(routes: Route[]): Promise<StopSignResult[]> {
  const results = await Promise.all(routes.map((route) => findStopSignsForRoute(route)))
  const allResults = results.flat()

  // Deduplicate by bounding box center point
  const seen = new Set<string>()
  const deduped = allResults.filter((result) => {
    const key = getBoundingBoxKey(result.avoidZone)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`[StopSignFinder] Deduplicated ${allResults.length} → ${deduped.length} stop signs`)
  return deduped
}
