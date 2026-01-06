import { z } from 'zod'

const environmentSchema = z.object({
  VITE_HERE_API_KEY: z.string(),
  VITE_MAPILLARY_ACCESS_TOKEN: z.string(),
  VITE_MAPILLARY_API_BASE: z.string(),
  VITE_VISION_BASE_URL: z.string(),
  VITE_TRAFFIC_BASE_URL: z.string(),
})

export const env = environmentSchema.parse(import.meta.env)
