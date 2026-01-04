/**
 * Geographic primitives using Zod schemas
 */

import { z } from 'zod/v4'

export const RoutePointSchema = z
  .object({
    lat: z.number().describe('Latitude'),
    lng: z.number().describe('Longitude'),
  })
  .describe('Geographic point with latitude and longitude')

export type RoutePoint = z.infer<typeof RoutePointSchema>
