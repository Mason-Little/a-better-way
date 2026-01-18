import type { BoundingBox, FlowResponse } from '@/entities'
import { env } from '@/lib/environment'

/** Fetch real-time traffic flow data for a bounding box area */
export async function fetchTrafficFlowByBbox(bbox: BoundingBox): Promise<FlowResponse | null> {
  const url = new URL(env.VITE_TRAFFIC_BASE_URL)
  url.searchParams.set('apiKey', env.VITE_HERE_API_KEY)

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      console.warn('[Traffic] Fetch failed:', res.status)
      return null
    }

    return res.json()
  } catch (e) {
    console.error('[Traffic] Error:', e)
    return null
  }
}
