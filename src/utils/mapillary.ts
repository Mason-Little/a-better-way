/**
 * Mapillary API utilities for fetching map features
 */

import type { MapillaryFeature, MapillaryResponse } from '@/entities'

/** Create a bounding box around a point for Mapillary API */
function createBbox(lat: number, lng: number, radiusMeters: number): [number, number, number, number] {
  // Approximate degrees per meter (varies by latitude)
  const latDegPerMeter = 1 / 111320
  const lngDegPerMeter = 1 / (111320 * Math.cos((lat * Math.PI) / 180))

  const latOffset = radiusMeters * latDegPerMeter
  const lngOffset = radiusMeters * lngDegPerMeter

  return [
    lng - lngOffset, // west
    lat - latOffset, // south
    lng + lngOffset, // east
    lat + latOffset, // north
  ]
}

/** Fetch map features from Mapillary within a radius of a point */
export async function getMapFeaturesNearby(
  lat: number,
  lng: number,
  radiusMeters = 5,
  limit = 200
): Promise<MapillaryFeature[]> {
  const bbox = createBbox(lat, lng, radiusMeters)
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
