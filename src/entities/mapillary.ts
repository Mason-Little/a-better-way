/**
 * Mapillary API Zod schemas
 */

import { z } from 'zod/v4'

export const MapillaryGeometrySchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]).describe('[lng, lat] coordinates'),
}).describe('GeoJSON Point geometry')

export const MapillaryFeatureSchema = z.object({
  id: z.string().describe('Unique feature ID'),
  object_value: z.string().describe('Object type (e.g., object--traffic-light)'),
  geometry: MapillaryGeometrySchema,
  first_seen_at: z.string().describe('ISO timestamp when first detected'),
  last_seen_at: z.string().describe('ISO timestamp when last detected'),
}).describe('A map feature from Mapillary')

export const MapillaryResponseSchema = z.object({
  data: z.array(MapillaryFeatureSchema).describe('Array of map features'),
}).describe('Mapillary API response')

export type MapillaryGeometry = z.infer<typeof MapillaryGeometrySchema>
export type MapillaryFeature = z.infer<typeof MapillaryFeatureSchema>
export type MapillaryResponse = z.infer<typeof MapillaryResponseSchema>
