import { z } from 'zod'

// --- Domain Types ---
// Inferred from Zod schemas for safety

// --- Zod Schemas ---

export const addressSchema = z.object({
  streetNumber: z.string().optional(),
  streetName: z.string().optional(),
  municipality: z.string().optional(),
  countrySubdivision: z.string().optional(),
  countrySubdivisionName: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  freeformAddress: z.string(),
  localName: z.string().optional(),
})

export const geometrySchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
})

export const featurePropertiesSchema = z.object({
  type: z.string().optional(),
  score: z.number().optional(),
  address: addressSchema,
})

export const featureSchema = z.object({
  type: z.literal('Feature'),
  id: z.string(),
  geometry: geometrySchema,
  properties: featurePropertiesSchema,
})

export const searchResponseSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(featureSchema),
})

// --- Exported Types ---

export type Address = z.infer<typeof addressSchema>
export type TomTomFeature = z.infer<typeof featureSchema>
export type TomTomSearchResponse = z.infer<typeof searchResponseSchema>

/**
 * Simplified search option suitable for UI dropdowns
 */
export type SearchOption = {
  id: string
  label: string
  address: Address
  coordinates: [number, number]
}
