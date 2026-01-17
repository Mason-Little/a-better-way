/**
 * HERE Traffic Flow API Client
 * Fetches real-time traffic flow data
 */

import type { BoundingBox, FlowResponse } from '@/entities'
import { env } from '@/lib/environment'

/**
 * Fetch traffic flow for a bounding box area
 * More efficient for multiple routes - single API call covers entire area
 */
export async function fetchTrafficFlowByBbox(bbox: BoundingBox): Promise<FlowResponse | null> {
  const apiKey = env.VITE_HERE_API_KEY

  const url = new URL(env.VITE_TRAFFIC_BASE_URL)
  url.searchParams.set('apiKey', apiKey)

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        in: {
          type: 'bbox',
          west: bbox.west,
          south: bbox.south,
          east: bbox.east,
          north: bbox.north,
        },
        locationReferencing: ['segmentRef', 'shape'],
        advancedFeatures: ['deepCoverage'],
      }),
    })

    if (!res.ok) {
      console.warn('[Traffic] Bbox fetch failed:', res.status)
      return null
    }

    const data = (await res.json()) as FlowResponse
    return data
  } catch (e) {
    console.error('[Traffic] Bbox fetch error:', e)
    return null
  }
}
