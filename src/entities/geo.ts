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

export const BoundingBoxSchema = z
  .object({
    north: z.number().describe('North latitude'),
    south: z.number().describe('South latitude'),
    east: z.number().describe('East longitude'),
    west: z.number().describe('West longitude'),
  })
  .describe('A geographic bounding box')

export type BoundingBox = z.infer<typeof BoundingBoxSchema>
