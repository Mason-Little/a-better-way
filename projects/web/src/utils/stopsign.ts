import type { LatLng, Route, StopSign, TurnAction } from '@/entities'
import { env } from '@/lib/environment'
import { bearing, decodePolyline, distance, pointBehind } from '@/utils/geo'

interface DetectResponse {
  stop_sign_detected: boolean
}

async function detectStopSign(point: LatLng, heading: number, conf = 0.25): Promise<boolean> {
  try {
    const res = await fetch(`${env.VITE_VISION_BASE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: point.lat, lon: point.lng, heading, conf }),
    })

    if (res.status === 200) {
      const data: DetectResponse = await res.json()
      return data.stop_sign_detected
    }
    return false
  } catch {
    return false
  }
}

function isSharpLeftTurn(action: TurnAction): boolean {
  return action.action === 'turn' && action.direction === 'left'
}

async function findForRoute(route: Route, knownSigns: StopSign[]): Promise<StopSign[]> {
  const poly = route.sections[0]?.polyline
  const actions = route.sections[0]?.turnByTurnActions
  if (!poly || !actions) return []

  const points = decodePolyline(poly)
  const results: StopSign[] = []

  for (const action of actions) {
    if (!isSharpLeftTurn(action)) continue

    const turnPoint = points[action.offset]
    const prevPoint = points[action.offset - 1]
    if (!turnPoint || !prevPoint) continue

    const isKnown =
      knownSigns.some((s) => distance(s, turnPoint) < 20) ||
      results.some((s) => distance(s, turnPoint) < 20)
    if (isKnown) continue

    const heading = bearing(prevPoint, turnPoint)
    const checkPoint = pointBehind(turnPoint, heading, 40)

    const detected = await detectStopSign(checkPoint, heading)
    if (detected) {
      results.push({ lat: turnPoint.lat, lng: turnPoint.lng, heading })
    }
  }

  return results
}

/** Find stop signs along routes using vision detection API */
export async function findStopSigns(
  routes: Route[],
  existing: StopSign[] = [],
): Promise<StopSign[]> {
  const all: StopSign[] = []

  for (const route of routes) {
    const found = await findForRoute(route, [...existing, ...all])
    all.push(...found)
  }

  const deduped: StopSign[] = []
  for (const sign of all) {
    if (!deduped.some((s) => distance(s, sign) < 20)) {
      deduped.push(sign)
    }
  }

  return deduped
}
