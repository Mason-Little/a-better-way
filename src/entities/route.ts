/**
 * Route-related Zod schemas
 */

import { z } from 'zod/v4'

import { BoundingBoxSchema, RoutePointSchema } from './geo'

const AvoidInputSchema = z
  .object({
    segments: z.array(z.string()).describe('Segment IDs that were avoided'),
    stopSignBoxes: z.array(BoundingBoxSchema).describe('Stop sign bounding boxes avoided'),
  })
  .describe('Snapshot of avoid zones at a specific iteration')

const RoadInfoSchema = z.object({
  name: z.array(z.object({ value: z.string(), language: z.string() })).optional(),
  number: z.array(z.object({ value: z.string(), language: z.string() })).optional(),
})

const RouteActionSchema = z
  .object({
    action: z.string().describe("Type of action (e.g., 'depart', 'arrive', 'turn')"),
    duration: z.number().describe('Duration in seconds'),
    length: z.number().describe('Length in meters'),
    instruction: z.string().optional().describe('Human-readable instruction'),
    direction: z.string().optional().describe("Direction (e.g., 'left', 'right')"),
    severity: z.string().optional().describe("Turn severity (e.g., 'light', 'normal')"),
    turnAngle: z.float32().optional().describe('Turn angle in degrees'),
    offset: z.number().describe('Offset in polyline'),
    exit: z.number().optional().describe('Exit number for roundabouts/highways'),
    nextRoad: RoadInfoSchema.optional().describe('Road name after this action'),
    currentRoad: RoadInfoSchema.optional().describe('Current road info'),
  })
  .describe('Action/maneuver on the route')

const RouteIncidentSchema = z
  .object({
    id: z.string().describe('Incident ID'),
    type: z.string().describe("Type (e.g., 'accident', 'construction')"),
    severity: z.string().optional().describe("Severity (e.g., 'minor', 'major')"),
    description: z.string().optional().describe('Description of incident'),
    startOffset: z.number().optional().describe('Start offset in polyline'),
    endOffset: z.number().optional().describe('End offset in polyline'),
  })
  .describe('Traffic incident on the route')

const DynamicSpeedInfoSchema = z.object({
  trafficSpeed: z.number().optional().describe('Traffic speed in m/s'),
  baseSpeed: z.number().optional().describe('Base speed without traffic in m/s'),
  jamFactor: z.number().optional().describe('Jam factor (0-10)'),
})

const RouteSpanSchema = z
  .object({
    offset: z.number().describe('Offset in polyline where span starts'),
    functionalClass: z.number().optional().describe('Road class (1=highway, 5=local)'),
    dynamicSpeedInfo: DynamicSpeedInfoSchema.optional().describe('Traffic speed info'),
    gates: z.boolean().optional().describe('Gate/barrier present'),
    railwayCrossings: z.boolean().optional().describe('Railway crossing present'),
    incidents: z.array(z.number()).optional().describe('Incident indices'),
  })
  .describe('Span data for a segment of the route')

const RouteSummarySchema = z.object({
  duration: z.number().describe('Duration in seconds'),
  length: z.number().describe('Length in meters'),
  baseDuration: z.number().optional().describe('Base duration without traffic'),
  typicalDuration: z.number().optional().describe('Typical duration'),
})

const PlaceLocationSchema = z.object({
  place: z.object({ location: RoutePointSchema }),
})

const RouteNoticeSchema = z
  .object({
    title: z.string().describe('Notice title'),
    code: z.string().describe('Notice code'),
    severity: z.string().describe('Notice severity'),
  })
  .describe('Notice/warning for a route section')

const RouteSectionSchema = z
  .object({
    id: z.string().describe('Unique section ID'),
    type: z.string().describe("Section type (e.g., 'vehicle')"),
    departure: PlaceLocationSchema.describe('Departure location'),
    arrival: PlaceLocationSchema.describe('Arrival location'),
    polyline: z.string().describe('Encoded polyline geometry'),
    summary: RouteSummarySchema.describe('Summary with distance and duration'),
    transport: z.object({ mode: z.string() }).describe('Transport mode used'),
    notices: z.array(RouteNoticeSchema).optional().describe('Notices/warnings for this section'),
    actions: z.array(RouteActionSchema).optional().describe('Actions/maneuvers'),
    turnByTurnActions: z.array(RouteActionSchema).optional().describe('Turn-by-turn actions'),
    incidents: z.array(RouteIncidentSchema).optional().describe('Traffic incidents'),
    spans: z.array(RouteSpanSchema).optional().describe('Span data'),
  })
  .describe('Route section')

const RouteEvaluationSchema = z
  .object({
    intersectingTrafficSegments: z
      .number()
      .describe('Number of traffic segments this route passes through'),
    intersectingStopSignBoxes: z
      .number()
      .describe('Number of stop sign zones this route passes through'),
    totalAvoidanceScore: z.number().describe('Combined avoidance score for UI display'),
  })
  .describe('Evaluation result for a route indicating avoidance zone intersections')

const RouteSchema = z
  .object({
    id: z.string().describe('Unique route ID'),
    sections: z.array(RouteSectionSchema).describe('Route sections'),
    iteration: z.number().optional().describe('Algorithm iteration number'),
    evaluation: RouteEvaluationSchema.optional().describe('Route evaluation results'),
    avoidInput: AvoidInputSchema.optional().describe('Avoid input used for route calculation'),
  })
  .describe('Complete route')

const RouteReturnTypeSchema = z
  .enum(['polyline', 'summary', 'typicalDuration', 'turnByTurnActions', 'incidents'])
  .describe('Return types for route response')

const RouteSpanTypeSchema = z
  .enum(['dynamicSpeedInfo', 'functionalClass', 'gates', 'railwayCrossings', 'incidents'])
  .describe('Span types for detailed segment data')

export type RouteAction = z.infer<typeof RouteActionSchema>
export type Route = z.infer<typeof RouteSchema>
export type RouteEvaluation = z.infer<typeof RouteEvaluationSchema>
export type AvoidInput = z.infer<typeof AvoidInputSchema>

const RoutingOptionsSchema = z
  .object({
    origin: RoutePointSchema.describe('Origin coordinates'),
    destination: RoutePointSchema.describe('Destination coordinates'),
    routingMode: z.enum(['fast', 'short']).optional().describe("'fast' = time, 'short' = distance"),
    transportMode: z
      .enum(['car', 'truck', 'pedestrian', 'bicycle', 'scooter'])
      .optional()
      .describe('Transport mode'),
    return: z.array(RouteReturnTypeSchema).optional().describe('Return types for response'),
    spans: z.array(RouteSpanTypeSchema).optional().describe('Span types for segment data'),
    departureTime: z.string().optional().describe("Departure time (ISO 8601 or 'any')"),
    alternatives: z.number().optional().describe('Number of alternative routes (0-6)'),
    avoid: z
      .object({
        features: z.array(z.string()).optional().describe("Features to avoid (e.g., 'tollRoad')"),
        areas: z.array(z.string()).optional().describe('Bounding boxes to avoid'),
        segments: z.array(z.string()).optional().describe('Segment IDs to avoid'),
      })
      .optional()
      .describe('Areas/features to avoid'),
    via: z.array(RoutePointSchema).optional().describe('Intermediate waypoints'),
  })
  .describe('Routing options for API request')

const RoutingResultSchema = z
  .object({
    routes: z.array(RouteSchema).describe('Calculated routes'),
  })
  .describe('Routing API response')

export type RoutingOptions = z.infer<typeof RoutingOptionsSchema>
export type RoutingResult = z.infer<typeof RoutingResultSchema>
