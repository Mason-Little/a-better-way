/**
 * Traffic-related Zod schemas
 */

import { z } from 'zod/v4'

import { RoutePointSchema } from './geo'
import { RouteIncidentSchema } from './route'

export const SlowdownSchema = z
  .object({
    location: RoutePointSchema.describe('Location of the slowdown'),
    offset: z.number().describe('Offset in polyline'),
    trafficSpeed: z.number().describe('Current traffic speed in m/s'),
    baseSpeed: z.number().describe('Normal speed without traffic in m/s'),
    slowdownPercent: z.number().describe('Slowdown as percentage (0-1)'),
    functionalClass: z.number().optional().describe('Road class (1=highway, 5=local)'),
  })
  .describe('A detected slowdown on the route')

export const LocatedIncidentSchema = RouteIncidentSchema.extend({
  location: RoutePointSchema.describe('Location of the incident'),
  offset: z.number().describe('Offset in polyline'),
}).describe('An incident with its location')

export const TrafficSummarySchema = z
  .object({
    delaySeconds: z.number().describe('Total delay in seconds'),
    hasTraffic: z.boolean().describe("Whether there's significant traffic"),
    slowdownCount: z.number().describe('Number of slowdown segments'),
    incidentCount: z.number().describe('Number of incidents'),
    worstSlowdown: z.number().describe('Worst slowdown percentage (0-1)'),
  })
  .describe('Traffic summary for a route')

export const AvoidZoneSchema = z
  .object({
    north: z.number().describe('North latitude'),
    south: z.number().describe('South latitude'),
    east: z.number().describe('East longitude'),
    west: z.number().describe('West longitude'),
  })
  .describe('A bounding box avoid zone for routing')

export const AvoidZoneOptionsSchema = z
  .object({
    radiusMeters: z.number().optional().describe('Radius around the point in meters'),
    slowdownThreshold: z
      .number()
      .optional()
      .describe('Only include slowdowns worse than this (0-1)'),
    includeIncidents: z.boolean().optional().describe('Include incidents in avoid zones'),
    includeSlowdowns: z.boolean().optional().describe('Include slowdowns in avoid zones'),
  })
  .describe('Options for generating avoid zones')

export const FlowItemSchema = z
  .object({
    location: z.object({
      reference: z.object({
        type: z.string(),
        id: z.string(),
        version: z.string(),
      }),
      shape: z.object({
        links: z.array(
          z.object({
            points: z.array(z.object({ lat: z.number(), lng: z.number() })),
          }),
        ),
      }),
    }),
    currentFlow: z.object({
      speed: z.number(),
      speedUncapped: z.number(),
      freeFlow: z.number(),
      jamFactor: z.number(),
      confidence: z.number(),
      traversability: z.string(),
    }),
  })
  .describe('Traffic flow item')

export const FlowResponseSchema = z
  .object({
    results: z.array(FlowItemSchema),
  })
  .describe('Traffic flow API response')

export type Slowdown = z.infer<typeof SlowdownSchema>
export type LocatedIncident = z.infer<typeof LocatedIncidentSchema>
export type TrafficSummary = z.infer<typeof TrafficSummarySchema>
export type AvoidZone = z.infer<typeof AvoidZoneSchema>
export type AvoidZoneOptions = z.infer<typeof AvoidZoneOptionsSchema>
export type FlowItem = z.infer<typeof FlowItemSchema>
export type FlowResponse = z.infer<typeof FlowResponseSchema>
