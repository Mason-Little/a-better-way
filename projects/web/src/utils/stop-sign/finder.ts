import type { Route, RouteAction, RoutePoint, StopSignResult } from '@/entities'
import { useAvoidanceStore } from '@/stores/avoidanceStore'
import { calculateBearing, calculateDistance, decodePolyline, getPointBehind } from '@/utils/geo'
import { detectStopSign } from '@/utils/stop-sign/stop-sign-recognition'

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
  return await detectStopSign(point, heading)
}

async function findStopSignsForRoute(route: Route): Promise<StopSignResult[]> {
  const polylinePoints = decodePolyline(route.sections[0]?.polyline ?? '')
  const turnByTurnActions = route.sections[0]?.turnByTurnActions
  const stopSignResults: StopSignResult[] = []
  const { stopSigns } = useAvoidanceStore()

  if (!turnByTurnActions) return []

  for (const [index, action] of turnByTurnActions.entries()) {
    if (isSharpLeftTurn(action)) {
      const turnPoint = polylinePoints[action.offset]

      if (!turnPoint) continue

      // Check if we already have a stop sign at this location
      // Also check against locally accumulated results to avoid duplicate calls within this same run
      const isKnown =
        stopSigns.value.some((sign) => calculateDistance(sign, turnPoint) < 20) ||
        stopSignResults.some((res) => calculateDistance(res.stopSign, turnPoint) < 20)

      if (isKnown) continue

      const lastPoint = polylinePoints[action.offset - 1]
      if (!lastPoint) continue

      const heading = calculateBearing(turnPoint, lastPoint)
      const offsetPoint = getPointBehind(turnPoint, heading, 40)
      if (!offsetPoint) continue

      const stopSignDetected = await checkForStopSignAtPoint(offsetPoint, heading)
      if (stopSignDetected) {
        stopSignResults.push({
          stopSign: { lat: turnPoint.lat, lng: turnPoint.lng, heading },
          actionIndex: index,
        })
      }
    }
  }

  return stopSignResults
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find stop signs across multiple routes
 * Sequentially checks routes to avoid hammering the API
 */
export async function findStopSigns(routes: Route[]): Promise<StopSignResult[]> {
  const allResults: StopSignResult[] = []

  for (const route of routes) {
    const results = await findStopSignsForRoute(route)
    allResults.push(...results)
  }

  // Deduplicate by proximity
  const deduped: StopSignResult[] = []

  for (const result of allResults) {
    const isDuplicate = deduped.some(
      (existing) => calculateDistance(existing.stopSign, result.stopSign) < 20,
    )

    if (!isDuplicate) {
      deduped.push(result)
    }
  }

  console.log(`[StopSignFinder] Deduplicated ${allResults.length} → ${deduped.length} stop signs`)
  return deduped
}
