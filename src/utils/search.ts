import { search } from '@tomtom-org/maps-sdk/services'
import { searchResponseSchema } from '@/types/search'
import type { SearchOption } from '@/types/search'

export async function searchAddress(query: string): Promise<SearchOption[]> {
  if (!query || query.trim().length < 3) {
    return []
  }

  const searchResult = await search({
    apiKey: import.meta.env.VITE_TOM_TOM_KEY,
    query,
    limit: 5,
  })

  // Validate response with Zod
  const result = searchResponseSchema.safeParse(searchResult)

  if (!result.success) {
    console.error('TomTom API validation error:', result.error)
    return []
  }

  return result.data.features.map((feature) => ({
    id: feature.id,
    label: feature.properties.address.freeformAddress,
    address: feature.properties.address,
    coordinates: feature.geometry.coordinates,
  }))
}
