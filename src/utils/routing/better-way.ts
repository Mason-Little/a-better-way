import { decodePolyline, createBoundingBox } from "@/utils/geo";
import { getRoutes } from "@/utils/routing/route";
import type { Route, RoutePoint, AvoidZone } from "@/entities";
import { formatAvoidZonesForApi } from "@/utils/traffic";
import { calculateRoute } from "@/lib/here-sdk";
import { drawRoutes } from "@/stores/mapStore";
import { detectStopSign } from "@/utils/vision";
import { calculateBearing, getPointBehind } from "@/utils/geo";


//TODO: ADD Via Points to

const DEBUG_MODE = false

export const STOP_SIGNS = [
    'regulatory--stop--g1',
    'regulatory--stop--g2',
    'regulatory--stop--g3',
    'regulatory--stop--g4',
    'regulatory--stop--g5',
    'regulatory--stop--g6',
    'regulatory--stop--g7',
    'regulatory--stop--g8',
    'regulatory--stop--g9',
    'regulatory--stop--g10',
] as const;

export type StopSignType = typeof STOP_SIGNS[number];

const MANUAL_STOP_SIGNS = [
  { lat: 49.722793, lng: -123.154701 },
  { lat: 49.735036, lng: -123.134583 }
]

function isSharpLeftTurn(action: any): boolean {
    return action.action === 'turn' && action.direction === 'left' && action.turnAngle && Math.abs(action.turnAngle) > 60
}

function checkDebugManualStopSign(point: { lat: number, lng: number }): AvoidZone | null {
    if (!DEBUG_MODE) return null

    for (const manual of MANUAL_STOP_SIGNS) {
        if (Math.abs(manual.lat - point.lat) < 0.001 && Math.abs(manual.lng - point.lng) < 0.001) {
            return createBoundingBox(point, 20)
        }
    }
    return null
}

async function checkForStopSignAtPoint(point: RoutePoint, heading: number): Promise<boolean> {
    const manualResult = checkDebugManualStopSign(point)
    if (manualResult) return true

    return await detectStopSign(point, heading)
}

export type StopSignResult = {
    avoidZone: AvoidZone
    actionIndex: number
}

async function findStopSigns(route: Route): Promise<StopSignResult[]> {
    const polylinePoints = decodePolyline(route.sections[0]?.polyline ?? "")
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

    results.forEach(result => {
        if (result) stopSignResults.push(result)
    })

    return stopSignResults
}

async function findInitialRoutes(start: RoutePoint, end: RoutePoint) {
    return getRoutes(start, end, {
        transportMode: 'car',
        routingMode: 'short',
        // alternatives: 3,
        return: ['turnByTurnActions', 'summary', "polyline"],
    })
}

async function calculateBetterRoute(origin: RoutePoint, destination: RoutePoint, avoidZones: StopSignResult[]): Promise<Route[]> {

    const avoidAreas = formatAvoidZonesForApi(avoidZones.map(zone => zone.avoidZone))

    try {
        const matchResult = await calculateRoute({
            origin,
            destination,
            avoid: {
                areas: avoidAreas
            },
            transportMode: 'car'
        })

        if (matchResult.routes && matchResult.routes.length > 0) {
            console.log(`[BetterWay] Successfully calculated better route`)
            return matchResult.routes
        } else {
            console.warn(`[BetterWay] No routes returned after matching`)
            return []
        }
    } catch (e) {
        console.warn(`[BetterWay] Failed to match better route:`, e)
        return []
    }
}

export const getBetterWayRoutes = async (start: RoutePoint, end: RoutePoint) => {
    const routeInfos = await findInitialRoutes(start, end)
    const improvedRoutes: Route[] = []

    if (routeInfos && routeInfos.length > 0) {
      drawRoutes({ routes: routeInfos.map(routeInfo => routeInfo.route) })
    }

    await new Promise(resolve => setTimeout(resolve, 5000))

    const allStopSignResults = await Promise.all(
        routeInfos.map(routeInfo => findStopSigns(routeInfo.route))
    )

    const processed = await calculateBetterRoute(start, end, allStopSignResults.flatMap(result => result))
    improvedRoutes.push(...processed)

    console.log(`[BetterWay] Returning ${improvedRoutes.length} improved routes`)
    return improvedRoutes
}
