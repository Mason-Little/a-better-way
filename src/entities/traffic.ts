/**
 * Traffic-related Zod schemas
 */

import { z } from 'zod/v4'

const AvoidZoneSchema = z
  .object({
    north: z.number().describe('North latitude'),
    south: z.number().describe('South latitude'),
    east: z.number().describe('East longitude'),
    west: z.number().describe('West longitude'),
  })
  .describe('A bounding box avoid zone for routing')

const FlowItemSchema = z
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

const FlowResponseSchema = z
  .object({
    results: z.array(FlowItemSchema),
  })
  .describe('Traffic flow API response')

export type AvoidZone = z.infer<typeof AvoidZoneSchema>
export type FlowItem = z.infer<typeof FlowItemSchema>
export type FlowResponse = z.infer<typeof FlowResponseSchema>
