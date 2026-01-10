import type { Route, RouteAction, RoutePoint, StopSignResult } from '@/entities'
import { useAvoidanceStore } from '@/stores/avoidanceStore'
import { calculateBearing, createBoundingBox, decodePolyline, getPointBehind } from '@/utils/geo'

function isSharpLeftTurn(action: RouteAction): boolean {
  return (
    action.action === 'turn' &&
    action.direction === 'left' &&
    action.turnAngle !== undefined &&
    Math.abs(action.turnAngle) > 60
  )
}

async function checkForStopSignAtPoint(point: RoutePoint, heading: number): Promise<boolean> {
  const { detectStopSignCached } = useAvoidanceStore()
  return await detectStopSignCached(point, heading)
}

async function findStopSignsForRoute(route: Route): Promise<StopSignResult[]> {
  const polylinePoints = decodePolyline(route.sections[0]?.polyline ?? '')
  const turnByTurnActions = route.sections[0]?.turnByTurnActions
  const stopSignResults: StopSignResult[] = []

  if (!turnByTurnActions) return []

  const checkPromises = turnByTurnActions.map(async (action, index) => {
    if (isSharpLeftTurn(action)) {
      const turnPoint = polylinePoints[action.offset]
      const lastPoint = polylinePoints[action.offset - 1]
      if (!turnPoint || !lastPoint) return null

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

/**
 * Generate a key for a bounding box to identify duplicates
 * Uses 4 decimal places (~10m accuracy) to handle floating point variations
 */
function getBoundingBoxKey(box: {
  north: number
  south: number
  east: number
  west: number
}): string {
  const centerLat = ((box.north + box.south) / 2).toFixed(4)
  const centerLng = ((box.east + box.west) / 2).toFixed(4)
  return `${centerLat},${centerLng}`
}

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
