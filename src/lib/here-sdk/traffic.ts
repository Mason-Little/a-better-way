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
  width = 1000,
): Promise<FlowResponse | null> {
  const apiKey = import.meta.env.VITE_HERE_API_KEY
  if (!apiKey) {
    console.warn('HERE API Key missing, skipping traffic fetch')
    return null
  }

  const url = new URL(BASE_URL)
  url.searchParams.append('in', `corridor:${encodedPolyline};r=${width}`)
  url.searchParams.append('locationReferencing', 'shape') // Request shape for drawing
  url.searchParams.append('apiKey', apiKey)

  // Optional: Add other params like minJamFactor to filter results?
  // For now fetch all and filter client side if needed.

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      console.error(`Traffic Flow API Error: ${response.status} ${response.statusText}`)
      return null
    }
    return (await response.json()) as FlowResponse
  } catch (error) {
    console.error('Failed to fetch traffic flow:', error)
    return null
  }
}
