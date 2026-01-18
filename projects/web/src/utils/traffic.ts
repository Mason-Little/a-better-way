import type { Route, TrafficFlowItem, TrafficFlowResponse, TrafficSegment } from '@/entities'
import { fetchTrafficFlowByBbox } from '@/lib/here-sdk/traffic'
import { decodePolyline, mergeBBoxes } from '@/utils/geo'
import { parseSegmentRef } from '@/utils/segments'

interface SubSegment {
  length: number
  speed: number
  freeFlow: number
  jamFactor: number
  confidence: number
}

function calcPriority(idx: number, total: number): number {
  return Math.floor(Math.abs(idx - (total - 1) / 2))
}

function isJammed(flow: { jamFactor: number }, threshold: number): boolean {
  return flow.jamFactor >= threshold
}

function mapShapeToSegments(item: TrafficFlowItem): Map<number, { lat: number; lng: number }[]> {
  const refs = item.location.segmentRef?.segments
  const links = item.location.shape?.links
  const map = new Map<number, { lat: number; lng: number }[]>()

  if (!refs || !links) return map

  const state = { linkIdx: 0, linkCumulative: 0 }

  for (const [i, seg] of refs.entries()) {
    const segEnd = state.linkCumulative + seg.length
    const points: { lat: number; lng: number }[] = []

    while (state.linkIdx < links.length) {
      const link = links[state.linkIdx]!
      points.push(...link.points)
      state.linkCumulative += link.length
      state.linkIdx++
      if (state.linkCumulative >= segEnd) break
    }
    map.set(i, points)
  }
  return map
}

/** Extract traffic segments from a flow item, handling subsegments for partial congestion */
function extractSegments(item: TrafficFlowItem, jamThreshold: number): TrafficSegment[] {
  const refs = item.location.segmentRef?.segments
  if (!refs?.length) return []

  const subSegments = (item.currentFlow as { subSegments?: SubSegment[] }).subSegments
  const hasSubSegments = subSegments && subSegments.length > 0
  const allJammed = !hasSubSegments || subSegments.every((sub) => isJammed(sub, jamThreshold))
  const shapeMap = mapShapeToSegments(item)

  // Case 1: No subsegments or all subsegments are jammed - check overall flow
  if (allJammed) {
    if (!isJammed(item.currentFlow, jamThreshold)) return []

    const results: TrafficSegment[] = []
    for (const [i, seg] of refs.entries()) {
      const id = parseSegmentRef(seg.ref)
      if (!id) continue
      results.push({
        id,
        priority: calcPriority(i, refs.length),
        shape: shapeMap.get(i),
        length: seg.length,
        speed: item.currentFlow.speed,
        freeFlow: item.currentFlow.freeFlow,
        jamFactor: item.currentFlow.jamFactor,
      })
    }
    return results
  }

  // Case 2: Partial congestion - map segments to subsegments by cumulative length
  const results: TrafficSegment[] = []
  const state = { segIdx: 0, segCumulative: 0 }

  for (const sub of subSegments) {
    const subEnd = state.segCumulative + sub.length
    const jammed = isJammed(sub, jamThreshold)
    const groupStartIdx = state.segIdx

    while (state.segIdx < refs.length) {
      const seg = refs[state.segIdx]!
      if (state.segCumulative >= subEnd) break

      if (jammed) {
        const id = parseSegmentRef(seg.ref)
        if (id) {
          results.push({
            id,
            priority: calcPriority(state.segIdx - groupStartIdx, refs.length),
            shape: shapeMap.get(state.segIdx),
            length: seg.length,
            speed: sub.speed,
            freeFlow: sub.freeFlow,
            jamFactor: sub.jamFactor,
          })
        }
      }

      state.segCumulative += seg.length
      state.segIdx++
    }
  }

  return results
}

function computeBBox(pts: { lat: number; lng: number }[]) {
  if (pts.length === 0) return { north: 0, south: 0, east: 0, west: 0 }
  return pts.reduce(
    (acc, p) => ({
      north: Math.max(acc.north, p.lat),
      south: Math.min(acc.south, p.lat),
      east: Math.max(acc.east, p.lng),
      west: Math.min(acc.west, p.lng),
    }),
    { north: -90, south: 90, east: -180, west: 180 },
  )
}

const cache: {
  bbox: { north: number; south: number; east: number; west: number } | null
  flow: TrafficFlowResponse | null
} = { bbox: null, flow: null }

/** Find congested traffic segments for routes using HERE Traffic API */
export async function findTrafficSegments(
  routes: Route[],
  jamThreshold = 5,
): Promise<TrafficSegment[]> {
  if (routes.length === 0) return []

  const boxes = routes.map((r) => computeBBox(decodePolyline(r.sections[0]?.polyline ?? '')))
  const bbox = mergeBBoxes(boxes)

  const needsFetch =
    !cache.bbox ||
    bbox.north > cache.bbox.north ||
    bbox.south < cache.bbox.south ||
    bbox.east > cache.bbox.east ||
    bbox.west < cache.bbox.west

  if (needsFetch) {
    cache.flow = await fetchTrafficFlowByBbox(bbox)
    cache.bbox = bbox
  }

  if (!cache.flow?.results) return []

  const segments: TrafficSegment[] = []
  for (const item of cache.flow.results) {
    segments.push(...extractSegments(item, jamThreshold))
  }
  return segments
}

/** Clear the traffic data cache */
export function clearTrafficCache() {
  cache.bbox = null
  cache.flow = null
}

/** Get the current traffic query bounding box */
export function getTrafficBBox() {
  return cache.bbox
}

