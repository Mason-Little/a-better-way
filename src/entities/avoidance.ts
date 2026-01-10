/**
 * Avoidance-related Zod schemas
 */

import { z } from 'zod/v4'

import { BoundingBoxSchema } from './geo'

const AvoidSnapshotSchema = z
  .object({
    segments: z.array(z.string()).describe('Segment IDs that were avoided'),
    stopSignBoxes: z.array(BoundingBoxSchema).describe('Stop sign bounding boxes avoided'),
    timestamp: z.number().describe('Timestamp when snapshot was taken'),
  })
  .describe('Snapshot of avoid zones at a specific iteration')

export type AvoidSnapshot = z.infer<typeof AvoidSnapshotSchema>
