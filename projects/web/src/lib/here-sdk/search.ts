import type { SearchResult } from '@/entities'

import { getPlatform } from './platform'

export type { SearchResult }

/** Search for places using HERE Autosuggest API */
export async function searchPlaces(
  query: string,
  at?: { lat: number; lng: number },
): Promise<SearchResult[]> {
  const platform = getPlatform()
  const service = platform.getSearchService()

  return new Promise((resolve, reject) => {
    service.autosuggest(
      {
        q: query,
        at: at ? `${at.lat},${at.lng}` : '37.7749,-122.4194',
        limit: 5,
      },
      (result) => {
        const items = result.items
          .filter((item) => item.position)
          .map((item) => ({
            id: item.id,
            title: item.title,
            address: item.address.label,
            position: item.position!,
          }))
        resolve(items)
      },
      (error: Error) => reject(error),
    )
  })
}
