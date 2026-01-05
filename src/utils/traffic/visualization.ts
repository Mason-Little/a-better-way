import type { FlowResponse } from '@/entities'

export type TrafficSegment = {
  id: string
  path: { lat: number; lng: number }[]
  midPoint: { lat: number; lng: number }
  color: string
  opacity: number
  weight: number
  details: {
    description?: string
    jamFactor: number
    speed: number
    freeFlow: number
    length: number
  }
}

/**
 * Determine color based on jam factor
 * 0-4: Green (Free flow)
 * 4-8: Orange (Heavy)
 * 8-10: Red (Congested/Stopped)
 */
function getTrafficColor(jamFactor: number): string {
  if (jamFactor >= 8) return '#d90429' // Deep Red
  if (jamFactor >= 4) return '#fb8500' // Orange
  return '#2dc653' // Green
}

/**
 * Parse Traffic Flow API response for map visualization
 * Simple approach: flatmap all links into individual segments
 */
export function parseTrafficFlowForMap(data: FlowResponse): TrafficSegment[] {
  if (!data?.results) return []

  const segments: TrafficSegment[] = []

  for (const item of data.results) {
    const { currentFlow, location } = item

    // Skip items without geometry
    if (!location.shape?.links) continue

    const links = location.shape.links
    const subSegments = currentFlow.subSegments

    // Process each link as its own segment
    links.forEach((link, index) => {
      if (!link.points || link.points.length < 2) return

      // Try to get subsegment data if available, otherwise use parent flow
      const flowData = subSegments?.[index] ?? currentFlow

      const jamFactor = flowData.jamFactor
      const speed = flowData.speed
      const freeFlow = flowData.freeFlow
      const length =
        'length' in flowData
          ? (flowData as { length: number }).length
          : location.length / links.length

      // Calculate midpoint
      const midIndex = Math.floor(link.points.length / 2)
      const midPoint = link.points[midIndex] ?? link.points[0]!

      // Generate ID
      const refId =
        item.location.segmentRef?.segments?.[index]?.ref ??
        item.location.segmentRef?.segments?.[0]?.ref
      const segmentId = refId
        ? `seg-${refId}-${index}`
        : `seg-${Math.random().toString(36).substr(2, 9)}`

      segments.push({
        id: segmentId,
        path: link.points,
        midPoint: midPoint!,
        color: getTrafficColor(jamFactor),
        opacity: 0.8,
        weight: 6,
        details: {
          description: location.description,
          jamFactor,
          speed,
          freeFlow,
          length: Math.round(length),
        },
      })
    })
  }

  return segments
}
