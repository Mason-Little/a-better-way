/**
 * Map-related Zod schemas
 */

import { z } from 'zod/v4'

const MapOptionsSchema = z
  .object({
    container: z.union([z.instanceof(HTMLElement), z.string()]).describe('Container element or ID'),
    center: z.object({ lat: z.number(), lng: z.number() }).optional().describe('Initial center'),
    zoom: z.number().optional().describe('Initial zoom (1-20)'),
    tilt: z.number().optional().describe('Initial tilt in degrees (0-60)'),
    heading: z.number().optional().describe('Initial heading in degrees'),
    interactive: z.boolean().optional().describe('Enable map interactions'),
    showControls: z.boolean().optional().describe('Show default UI controls'),
    pixelRatio: z.number().optional().describe('Pixel ratio for high-DPI'),
  })
  .describe('Map creation options')

const MapViewOptionsSchema = z
  .object({
    center: z.object({ lat: z.number(), lng: z.number() }).optional().describe('Center point'),
    zoom: z.number().optional().describe('Zoom level (1-20)'),
    heading: z.number().optional().describe('Heading in degrees (0 = North)'),
    tilt: z.number().optional().describe('Tilt in degrees (0-60)'),
    animate: z.boolean().optional().describe('Animate the transition'),
  })
  .describe('Map view/camera options')

export type MapOptions = z.infer<typeof MapOptionsSchema>
export type MapViewOptions = z.infer<typeof MapViewOptionsSchema>
