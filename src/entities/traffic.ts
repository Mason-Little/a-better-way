/**
 * Traffic-related Zod schemas
 */

import { z } from 'zod/v4'

const SegmentRefSchema = z.object({
  ref: z.string(),
  length: z.number(),
})

/**
 * Base traffic flow data - shared structure for speed/flow metrics
 */
const TrafficFlowDataSchema = z.object({
  speed: z.number().describe('Current speed in m/s'),
  freeFlow: z.number().describe('Free flow speed in m/s'),
  jamFactor: z.number().describe('Jam factor (0-10)'),
})

const SubSegmentSchema = TrafficFlowDataSchema.extend({
  length: z.number().describe('Length in meters'),
})

const FlowItemSchema = z
  .object({
    location: z.object({
      // The API returns segmentRef when locationReferencing includes 'segmentRef'
      segmentRef: z
        .object({
          segments: z.array(SegmentRefSchema),
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
    currentFlow: TrafficFlowDataSchema.extend({
      speedUncapped: z.number(),
      confidence: z.number(),
      traversability: z.string(),
      subSegments: z
        .array(
          SubSegmentSchema.extend({
            speedUncapped: z.number(),
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
    refReplacements: z.record(z.string(), z.string()).optional(),
  })
  .describe('Traffic flow API response')

const PrioritizedSegmentSchema = z.object({
  id: z.string(),
  priority: z.number(),
})

export type TrafficFlowData = z.infer<typeof TrafficFlowDataSchema>
export type FlowItem = z.infer<typeof FlowItemSchema>
export type FlowResponse = z.infer<typeof FlowResponseSchema>
export type PrioritizedSegment = z.infer<typeof PrioritizedSegmentSchema>
