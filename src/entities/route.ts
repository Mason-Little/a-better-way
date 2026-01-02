/**
 * Route-related Zod schemas
 */

import { z } from 'zod/v4'
import { RoutePointSchema } from './geo'

const RoadInfoSchema = z.object({
  name: z.array(z.object({ value: z.string(), language: z.string() })).optional(),
  number: z.array(z.object({ value: z.string(), language: z.string() })).optional(),
})

export const RouteActionSchema = z.object({
  action: z.string().describe("Type of action (e.g., 'depart', 'arrive', 'turn')"),
  duration: z.number().describe('Duration in seconds'),
  length: z.number().describe('Length in meters'),
  instruction: z.string().optional().describe('Human-readable instruction'),
  direction: z.string().optional().describe("Direction (e.g., 'left', 'right')"),
  severity: z.string().optional().describe("Turn severity (e.g., 'light', 'normal')"),
  offset: z.number().describe('Offset in polyline'),
  exit: z.number().optional().describe('Exit number for roundabouts/highways'),
  nextRoad: RoadInfoSchema.optional().describe('Road name after this action'),
  currentRoad: RoadInfoSchema.optional().describe('Current road info'),
}).describe('Action/maneuver on the route')

export const RouteIncidentSchema = z.object({
  id: z.string().describe('Incident ID'),
  type: z.string().describe("Type (e.g., 'accident', 'construction')"),
  severity: z.string().optional().describe("Severity (e.g., 'minor', 'major')"),
  description: z.string().optional().describe('Description of incident'),
  startOffset: z.number().optional().describe('Start offset in polyline'),
  endOffset: z.number().optional().describe('End offset in polyline'),
}).describe('Traffic incident on the route')

const DynamicSpeedInfoSchema = z.object({
  trafficSpeed: z.number().optional().describe('Traffic speed in m/s'),
  baseSpeed: z.number().optional().describe('Base speed without traffic in m/s'),
  jamFactor: z.number().optional().describe('Jam factor (0-10)'),
})

export const RouteSpanSchema = z.object({
  offset: z.number().describe('Offset in polyline where span starts'),
  functionalClass: z.number().optional().describe('Road class (1=highway, 5=local)'),
  dynamicSpeedInfo: DynamicSpeedInfoSchema.optional().describe('Traffic speed info'),
  gates: z.boolean().optional().describe('Gate/barrier present'),
  railwayCrossings: z.boolean().optional().describe('Railway crossing present'),
  incidents: z.array(z.number()).optional().describe('Incident indices'),
}).describe('Span data for a segment of the route')

const RouteSummarySchema = z.object({
  duration: z.number().describe('Duration in seconds'),
  length: z.number().describe('Length in meters'),
  baseDuration: z.number().optional().describe('Base duration without traffic'),
  typicalDuration: z.number().optional().describe('Typical duration'),
})

const PlaceLocationSchema = z.object({
  place: z.object({ location: RoutePointSchema }),
})

export const RouteSectionSchema = z.object({
  id: z.string().describe('Unique section ID'),
  type: z.string().describe("Section type (e.g., 'vehicle')"),
  departure: PlaceLocationSchema.describe('Departure location'),
  arrival: PlaceLocationSchema.describe('Arrival location'),
  polyline: z.string().describe('Encoded polyline geometry'),
  summary: RouteSummarySchema.describe('Summary with distance and duration'),
  transport: z.object({ mode: z.string() }).describe('Transport mode used'),
  actions: z.array(RouteActionSchema).optional().describe('Actions/maneuvers'),
  turnByTurnActions: z.array(RouteActionSchema).optional().describe('Turn-by-turn actions'),
  incidents: z.array(RouteIncidentSchema).optional().describe('Traffic incidents'),
  spans: z.array(RouteSpanSchema).optional().describe('Span data'),
}).describe('Route section')

export const RouteSchema = z.object({
  id: z.string().describe('Unique route ID'),
  sections: z.array(RouteSectionSchema).describe('Route sections'),
}).describe('Complete route')

export const RouteReturnTypeSchema = z.enum([
  'polyline',
  'summary',
  'typicalDuration',
  'turnByTurnActions',
  'incidents',
]).describe('Return types for route response')

export const RouteSpanTypeSchema = z.enum([
  'dynamicSpeedInfo',
  'functionalClass',
  'gates',
  'railwayCrossings',
  'incidents',
]).describe('Span types for detailed segment data')

export type RouteAction = z.infer<typeof RouteActionSchema>
export type RouteIncident = z.infer<typeof RouteIncidentSchema>
export type RouteSpan = z.infer<typeof RouteSpanSchema>
export type RouteSection = z.infer<typeof RouteSectionSchema>
export type Route = z.infer<typeof RouteSchema>
export type RouteReturnType = z.infer<typeof RouteReturnTypeSchema>
export type RouteSpanType = z.infer<typeof RouteSpanTypeSchema>
