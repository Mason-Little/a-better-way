import type { FlowResponse, SubSegment } from '@/entities'

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

type Link = {
  points: { lat: number; lng: number }[]
  length?: number
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
 * Map links to their corresponding subSegment flow data using length calculations
 * Returns an array where each index corresponds to a link, containing the subSegment data for that link
 */
function mapLinksToSubSegments(links: Link[], subSegments: SubSegment[]): (SubSegment | null)[] {
  const result: (SubSegment | null)[] = Array.from({ length: links.length }, () => null)

  if (!subSegments?.length) return result

  let linkIdx = 0
  let linkAccumulatedLength = 0
  let subSegmentAccumulatedLength = 0

  for (const subSegment of subSegments) {
    const subSegmentEnd = subSegmentAccumulatedLength + subSegment.length

    // Assign this subSegment to all links that fall within its range
    while (linkIdx < links.length) {
      const link = links[linkIdx]
      if (!link) break
      const linkLength = 'length' in link ? (link.length as number) : 0
      const linkEnd = linkAccumulatedLength + linkLength

      // Check if this link is within the current subSegment
      if (linkAccumulatedLength < subSegmentEnd) {
        result[linkIdx] = subSegment
      }

      // Move to next link if we've passed it
      if (linkEnd <= subSegmentEnd) {
        linkAccumulatedLength = linkEnd
        linkIdx++
      } else {
        break
      }
    }

    subSegmentAccumulatedLength = subSegmentEnd
  }

  return result
}

/**
 * Parse Traffic Flow API response for map visualization
 * Uses length-based mapping to correctly assign subSegment flow data to links
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

    // Map links to their corresponding subSegment using length calculations
    const linkFlowData = subSegments?.length
      ? mapLinksToSubSegments(links, subSegments)
      : Array.from({ length: links.length }, () => null)

    // Process each link as its own segment
    links.forEach((link, index) => {
      if (!link.points || link.points.length < 2) return

      // Use mapped subSegment data if available, otherwise use parent flow
      const flowData = linkFlowData[index] ?? currentFlow

      const jamFactor = flowData.jamFactor
      const speed = flowData.speed
      const freeFlow = flowData.freeFlow
      const length = 'length' in link ? (link.length as number) : location.length / links.length

      // Calculate midpoint
      const midIndex = Math.floor(link.points.length / 2)
      const midPoint = link.points[midIndex] ?? link.points[0]!

      // Generate ID
      const refId = item.location.segmentRef?.segments?.[0]?.ref ?? `fallback-${index}`
      const segmentId = `seg-${refId}-link${index}`

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
