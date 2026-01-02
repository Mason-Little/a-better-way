/**
 * HERE Maps Search Service
 * Handles geocoding and autosuggest functionality
 */

import { getPlatform } from './platform'
import type { SearchResult } from '@/entities'

// Re-export type for convenience
export type { SearchResult }

/**
 * Search for places using HERE Autosuggest API
 * @param query Search text
 * @param at Center coordinates for bias (optional)
 */
export async function searchPlaces(
  query: string,
  at?: { lat: number; lng: number }
): Promise<SearchResult[]> {
  const platform = getPlatform()
  const service = platform.getSearchService()

  return new Promise((resolve, reject) => {
    service.autosuggest(
      {
        q: query,
        at: at ? `${at.lat},${at.lng}` : '37.7749,-122.4194', // Default to SF if not provided
        limit: 5,
      },
      (result) => {
        const items = result.items
          .filter((item) => item.position) // Only returned items with position
          .map((item) => ({
            id: item.id,
            title: item.title,
            address: item.address.label,
            position: item.position!,
          }))
        resolve(items)
      },
      (error: Error) => {
        reject(error)
      }
    )
  })
}
