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

export async function findStopSigns(routes: Route[]): Promise<StopSignResult[]> {
  const results = await Promise.all(routes.map((route) => findStopSignsForRoute(route)))
  return results.flat()
}
