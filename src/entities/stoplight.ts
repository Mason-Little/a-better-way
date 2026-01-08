/**
 * Stoplight/Stop Sign-related Zod schemas
 */

import { z } from 'zod/v4'

import { BoundingBoxSchema } from './geo'

const StopSignResultSchema = z
  .object({
    avoidZone: BoundingBoxSchema.describe('Bounding box around the stop sign'),
    actionIndex: z.number().describe('Index of the turn action with stop sign'),
  })
  .describe('Result of stop sign detection for a route action')

export type StopSignResult = z.infer<typeof StopSignResultSchema>
