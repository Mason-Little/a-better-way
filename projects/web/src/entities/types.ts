import { z } from 'zod/v4'

export const LatLng = z.object({
  lat: z.number(),
  lng: z.number(),
})
export type LatLng = z.infer<typeof LatLng>

export const BBox = z.object({
  north: z.number(),
  south: z.number(),
  east: z.number(),
  west: z.number(),
})
export type BBox = z.infer<typeof BBox>

export interface RouteSummary {
  duration: number
  length: number
  baseDuration?: number
}

export interface RouteNotice {
  title: string
  code: string
  severity: 'critical' | 'info'
}

export interface RouteSection {
  id: string
  polyline: string
  summary: RouteSummary
  spans?: RouteSpan[]
  turnByTurnActions?: TurnAction[]
  notices?: RouteNotice[]
}

export interface RouteSpan {
  offset: number
  segmentRef?: string | string[]
}

export interface TurnAction {
  action: string
  offset: number
  instruction?: string
  direction?: string
}

/** Avoidance inputs used to create a route */
export interface InputAvoids {
  segments: string[]
  areas: string[]
}

/** Segments/areas that were requested to avoid but route had to go through */
export interface RouteViolations {
  segments: string[]
  areas: string[]
}

export interface Route {
  id: string
  sections: RouteSection[]
  iteration?: number
  inputAvoids?: InputAvoids
  score?: RouteScore
  violations?: RouteViolations
}

export interface RouteScore {
  trafficSegmentCount: number
  stopSignCount: number
  total: number
  hasViolation: boolean
}

export interface RouteRequest {
  origin: LatLng
  destination: LatLng
  alternatives?: number
  avoid?: { segments?: string[]; areas?: string[] }
}

export interface RouteResponse {
  routes: Route[]
}

export interface TrafficSegment {
  id: string
  priority: number
  shape?: LatLng[]
  length?: number
  speed?: number
  freeFlow?: number
  jamFactor?: number
}

export interface TrafficFlowResponse {
  results: TrafficFlowItem[]
  refReplacements: Record<string, string>
}

export interface TrafficFlowItem {
  location: {
    segmentRef?: { segments: { ref: string; length: number }[] }
    shape?: { links: { points: LatLng[]; length: number }[] }
    length: number
  }
  currentFlow: { speed: number; freeFlow: number; jamFactor: number }
}

export interface StopSign {
  lat: number
  lng: number
  heading: number
}

export interface SearchResult {
  id: string
  title: string
  address: string
  position: LatLng
}

export interface MapOptions {
  container: HTMLElement | string
  center?: LatLng
  zoom?: number
  tilt?: number
  heading?: number
  interactive?: boolean
  showControls?: boolean
  pixelRatio?: number
}

export interface PuckOptions {
  size?: number
  primaryColor?: string
  borderColor?: string
  showAccuracyRing?: boolean
  accuracyRingColor?: string
  showHeading?: boolean
  useDomMarker?: boolean
  zIndex?: number
}

export interface PuckPosition {
  lat: number
  lng: number
  heading?: number
  accuracy?: number
}

// Backward compatibility aliases
export type BoundingBox = BBox
export type FlowResponse = TrafficFlowResponse
export type RoutingResult = RouteResponse
