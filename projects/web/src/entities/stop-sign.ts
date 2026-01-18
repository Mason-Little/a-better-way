/**
 * Stop Sign-related Zod schemas
 */

import { z } from 'zod/v4'

const StopSignSchema = z
  .object({
    lat: z.number(),
    lng: z.number(),
    heading: z.number(),
  })
  .describe('Confirmed stop sign location')

export type StopSign = z.infer<typeof StopSignSchema>

const StopSignResultSchema = z
  .object({
    stopSign: StopSignSchema,
    actionIndex: z.number().describe('Index of the turn action with stop sign'),
  })
  .describe('Result of stop sign detection for a route action')

export type StopSignResult = z.infer<typeof StopSignResultSchema>
