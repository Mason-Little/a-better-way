/**
 * HERE Traffic Flow API Client
 * Fetches real-time traffic flow data
 */

import type { FlowResponse } from '@/entities'

const BASE_URL = import.meta.env.VITE_TRAFFIC_BASE_URL

/**
 * Fetch traffic flow for a route corridor
 */
export async function fetchTrafficFlow(
  encodedPolyline: string,
  width = 150,
): Promise<FlowResponse | null> {
  const apiKey = import.meta.env.VITE_HERE_API_KEY
  if (!apiKey) return null

  const url = new URL(BASE_URL)
  url.searchParams.set('apiKey', apiKey)

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        in: {
          type: 'corridor',
          corridor: encodedPolyline,
          radius: width,
        },
        locationReferencing: ['segmentRef'],
        advancedFeatures: ['deepCoverage'],
      }),
    })

    if (!res.ok) return null
    return (await res.json()) as FlowResponse
  } catch {
    return null
  }
}
