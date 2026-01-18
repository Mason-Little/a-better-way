import type { RouteRequest, RouteResponse } from '@/entities'
import { env } from '@/lib/environment'

/** Calculate routes between two points using HERE Routing API v8 */
export async function calculateRoute(options: RouteRequest): Promise<RouteResponse> {
  const { origin, destination, alternatives = 0, avoid } = options

  const url = new URL(env.VITE_ROUTING_BASE_URL)
  url.searchParams.set('apiKey', env.VITE_HERE_API_KEY)
  url.searchParams.set('origin', `${origin.lat},${origin.lng}`)
  url.searchParams.set('destination', `${destination.lat},${destination.lng}`)
  url.searchParams.set('routingMode', 'fast')
  url.searchParams.set('transportMode', 'car')
  url.searchParams.set('return', 'polyline,summary,turnByTurnActions')
  url.searchParams.set('spans', 'segmentRef')

  if (alternatives > 0) {
    url.searchParams.set('alternatives', alternatives.toString())
  }

  const body: { avoid?: { segments?: string[]; areas?: string[] } } = {}
  if (avoid?.segments?.length || avoid?.areas?.length) {
    body.avoid = {}
    if (avoid.segments?.length) body.avoid.segments = avoid.segments
    if (avoid.areas?.length) body.avoid.areas = avoid.areas
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Routing failed: ${res.status}`)
  return res.json()
}
