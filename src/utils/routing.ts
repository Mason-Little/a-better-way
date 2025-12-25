import { calculateRoute } from '@tomtom-org/maps-sdk/services'
import type { Route } from '@tomtom-org/maps-sdk/core'

export async function getRoute(start: [number, number], end: [number, number]): Promise<Route | undefined> {
  try {
    const response = await calculateRoute({
      apiKey: import.meta.env.VITE_TOM_TOM_KEY,
      locations: [start, end],
    })

    if (response.features && response.features.length > 0) {
      return response.features[0]
    }
  } catch (error) {
    console.error('Failed to calculate route:', error)
  }
  return undefined
}
