/**
 * Mapillary API Utilities
 * Fetch and process map features from Mapillary
 */

import type { MapillaryFeature, MapillaryResponse } from '@/entities'
import { createBboxArray } from '@/utils/geo'

/** Fetch map features from Mapillary within a radius of a point */
export async function getMapFeaturesNearby(
  lat: number,
  lng: number,
  radiusMeters = 5,
  limit = 200
): Promise<MapillaryFeature[]> {
  const bbox = createBboxArray(lat, lng, radiusMeters)
  const bboxStr = bbox.join(',')

  const url = new URL(`${import.meta.env.VITE_MAPILLARY_API_BASE}/map_features`)
  url.searchParams.set('access_token', import.meta.env.VITE_MAPILLARY_ACCESS_TOKEN)
  url.searchParams.set('fields', 'id,object_value,geometry,first_seen_at,last_seen_at')
  url.searchParams.set('bbox', bboxStr)
  url.searchParams.set('limit', limit.toString())

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Mapillary API error: ${response.status} ${response.statusText}`)
  }

  const data: MapillaryResponse = await response.json()
  return data.data
}

/** Filter features by object type */
export function filterByObjectType(features: MapillaryFeature[], objectType: string): MapillaryFeature[] {
  return features.filter((f) => f.object_value.startsWith(objectType))
}

/**
 * Group features by their object value
 */
export function groupByObjectType(features: MapillaryFeature[]): Record<string, MapillaryFeature[]> {
  return features.reduce(
    (acc, feature) => {
      const key = feature.object_value
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(feature)
      return acc
    },
    {} as Record<string, MapillaryFeature[]>
  )
}
