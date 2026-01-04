/**
 * Routing request/response Zod schemas
 */

import { z } from 'zod/v4'

import { RoutePointSchema } from './geo'
import { RouteReturnTypeSchema, RouteSchema, RouteSpanTypeSchema } from './route'

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

const RouteInfoSchema = z
  .object({
    route: RouteSchema.describe('The calculated route'),
    duration: z.number().describe('Total duration in seconds'),
    distance: z.number().describe('Total distance in meters'),
    formattedDuration: z.string().describe('Formatted duration (e.g., "1h 23m")'),
    formattedDistance: z.string().describe('Formatted distance (e.g., "45.2 km")'),
  })
  .describe('Route info with formatted summary')

export type RoutingOptions = z.infer<typeof RoutingOptionsSchema>
export type RoutingResult = z.infer<typeof RoutingResultSchema>
export type RouteInfo = z.infer<typeof RouteInfoSchema>
