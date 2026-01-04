/**
 * Search-related Zod schemas
 */

import { z } from 'zod/v4'

export const SearchResultSchema = z
  .object({
    id: z.string().describe('Result ID'),
    title: z.string().describe('Place title'),
    address: z.string().describe('Full address'),
    position: z
      .object({
        lat: z.number().describe('Latitude'),
        lng: z.number().describe('Longitude'),
      })
      .describe('Position coordinates'),
  })
  .describe('Search result from autosuggest')

export type SearchResult = z.infer<typeof SearchResultSchema>
