/**
 * Puck-related Zod schemas
 */

import { z } from 'zod/v4'

const PuckOptionsSchema = z
  .object({
    size: z.number().optional().describe('Puck size in pixels'),
    primaryColor: z.string().optional().describe('Primary color (CSS)'),
    borderColor: z.string().optional().describe('Border color (CSS)'),
    showAccuracyRing: z.boolean().optional().describe('Show accuracy ring'),
    accuracyRingColor: z.string().optional().describe('Accuracy ring color (CSS)'),
    showHeading: z.boolean().optional().describe('Show heading indicator'),
    useDomMarker: z.boolean().optional().describe('Use DOM marker for rich styling'),
    zIndex: z.number().optional().describe('Z-index for rendering order'),
  })
  .describe('Puck styling options')

const PuckPositionSchema = z
  .object({
    lat: z.number().describe('Latitude'),
    lng: z.number().describe('Longitude'),
    heading: z.number().optional().describe('Heading in degrees (0 = North)'),
    accuracy: z.number().optional().describe('Horizontal accuracy in meters'),
  })
  .describe('Puck position with heading')

export type PuckOptions = z.infer<typeof PuckOptionsSchema>
export type PuckPosition = z.infer<typeof PuckPositionSchema>
