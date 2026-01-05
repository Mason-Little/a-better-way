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
      // The API returns segmentRef when locationReferencing includes 'segmentRef'
      segmentRef: z
        .object({
          segments: z.array(
            z.object({
              ref: z.string(),
              length: z.number(),
            }),
          ),
        })
        .optional(),
      // The API returns shape when locationReferencing includes 'shape'
      shape: z
        .object({
          links: z.array(
            z.object({
              points: z.array(z.object({ lat: z.number(), lng: z.number() })),
            }),
          ),
        })
        .optional(),
      description: z.string().optional(),
      length: z.number(),
    }),
    currentFlow: z.object({
      speed: z.number(),
      speedUncapped: z.number(),
      freeFlow: z.number(),
      jamFactor: z.number(),
      confidence: z.number(),
      traversability: z.string(),
      subSegments: z
        .array(
          z.object({
            length: z.number(),
            speed: z.number(),
            speedUncapped: z.number(),
            freeFlow: z.number(),
            jamFactor: z.number(),
            confidence: z.number(),
            traversability: z.string(),
          }),
        )
        .optional(),
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

const TrafficAvoidanceOptionsSchema = z
  .object({
    jamFactorThreshold: z.number().optional().default(8).describe('Minimum jam factor (0-10)'),
    speedReductionThreshold: z
      .number()
      .optional()
      .default(0.5)
      .describe('Minimum speed reduction (0-1)'),
  })
  .describe('Configuration for generating traffic avoid zones')

export type TrafficAvoidanceOptions = z.infer<typeof TrafficAvoidanceOptionsSchema>

export type AvoidanceResult = {
  segments: string[]
  areas: AvoidZone[]
}
