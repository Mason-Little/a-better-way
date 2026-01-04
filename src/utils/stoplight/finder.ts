import type { AvoidZone, Route, RouteAction, RoutePoint } from '@/entities'
import { calculateBearing, createBoundingBox, decodePolyline, getPointBehind } from '@/utils/geo'

import { detectStopSign } from './stop-sign-recognition'

export type StopSignResult = {
  avoidZone: AvoidZone
  actionIndex: number
}

function isSharpLeftTurn(action: RouteAction): boolean {
  return (
    action.action === 'turn' &&
    action.direction === 'left' &&
    action.turnAngle !== undefined &&
    Math.abs(action.turnAngle) > 60
  )
}

async function checkForStopSignAtPoint(point: RoutePoint, heading: number): Promise<boolean> {
  return await detectStopSign(point, heading)
}

export async function findStopSigns(route: Route): Promise<StopSignResult[]> {
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
