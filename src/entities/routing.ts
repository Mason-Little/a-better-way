/**
 * Routing request/response Zod schemas
 */

import { z } from 'zod/v4'
import { RoutePointSchema } from './geo'
import { RouteSchema, RouteReturnTypeSchema, RouteSpanTypeSchema } from './route'
import { TrafficSummarySchema, AvoidZoneSchema } from './traffic'

export const RoutingOptionsSchema = z.object({
  origin: RoutePointSchema.describe('Origin coordinates'),
  destination: RoutePointSchema.describe('Destination coordinates'),
  routingMode: z.enum(['fast', 'short']).optional().describe("'fast' = time, 'short' = distance"),
  transportMode: z.enum(['car', 'truck', 'pedestrian', 'bicycle', 'scooter']).optional().describe('Transport mode'),
  return: z.array(RouteReturnTypeSchema).optional().describe('Return types for response'),
  spans: z.array(RouteSpanTypeSchema).optional().describe('Span types for segment data'),
  departureTime: z.string().optional().describe("Departure time (ISO 8601 or 'any')"),
  alternatives: z.number().optional().describe('Number of alternative routes (0-6)'),
  avoid: z.object({
    features: z.array(z.string()).optional().describe("Features to avoid (e.g., 'tollRoad')"),
    areas: z.array(z.string()).optional().describe("Bounding boxes to avoid"),
  }).optional().describe('Areas/features to avoid'),
}).describe('Routing options for API request')

export const RoutingResultSchema = z.object({
  routes: z.array(RouteSchema).describe('Calculated routes'),
}).describe('Routing API response')

export const BetterWayOptionsSchema = RoutingOptionsSchema.omit({ avoid: true }).extend({
  slowdownThreshold: z.number().optional().describe('Min slowdown to avoid (0-1, default: 0.25)'),
  avoidRadiusMeters: z.number().optional().describe('Radius around traffic to avoid (default: 500)'),
  minTimeSavings: z.number().optional().describe('Min time savings in seconds (default: 60)'),
  avoidIncidents: z.boolean().optional().describe('Include incidents in avoid zones'),
  avoidSlowdowns: z.boolean().optional().describe('Include slowdowns in avoid zones'),
  alternatives: z.number().optional().describe('Number of alternatives (default: 6)'),
}).describe('Better way routing options')

export const BetterWayResultSchema = z.object({
  originalRoute: RouteSchema.describe('Original route (may have traffic)'),
  originalTraffic: TrafficSummarySchema.describe('Traffic summary for original route'),
  betterRoute: RouteSchema.nullable().describe('Alternative route avoiding traffic'),
  betterTraffic: TrafficSummarySchema.nullable().describe('Traffic summary for better route'),
  timeSaved: z.number().describe('Time saved in seconds'),
  avoidZones: z.array(AvoidZoneSchema).describe('Generated avoid zones'),
  hasBetterRoute: z.boolean().describe('Whether a better route was found'),
  allRoutes: z.array(RouteSchema).describe('All alternative routes'),
}).describe('Better way routing result')

export const RouteInfoSchema = z.object({
  route: RouteSchema.describe('The calculated route'),
  duration: z.number().describe('Total duration in seconds'),
  distance: z.number().describe('Total distance in meters'),
  formattedDuration: z.string().describe('Formatted duration (e.g., "1h 23m")'),
  formattedDistance: z.string().describe('Formatted distance (e.g., "45.2 km")'),
}).describe('Route info with formatted summary')

export type RoutingOptions = z.infer<typeof RoutingOptionsSchema>
export type RoutingResult = z.infer<typeof RoutingResultSchema>
export type BetterWayOptions = z.infer<typeof BetterWayOptionsSchema>
export type BetterWayResult = z.infer<typeof BetterWayResultSchema>
export type RouteInfo = z.infer<typeof RouteInfoSchema>
