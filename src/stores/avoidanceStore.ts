/**
 * Avoidance Store
 * Manages traffic segments, stop signs, and avoidance caching using a singleton state pattern.
 */

import { ref } from 'vue'

import type {
  AvoidSnapshot,
  BoundingBox,
  FlowResponse,
  PrioritizedSegment,
  Route,
  RoutePoint,
} from '@/entities'
import { useMapStore } from '@/stores/mapStore'
import { findIntersectingSegments } from '@/utils/geo/intersection'
import { detectStopSign } from '@/utils/stoplight/stop-sign-recognition'

// ─────────────────────────────────────────────────────────────────────────────
// Shared State
// ─────────────────────────────────────────────────────────────────────────────

/** Accumulated traffic segments to avoid (with priority info) */
const trafficSegments = ref<PrioritizedSegment[]>([])

/** Accumulated stop sign bounding boxes to avoid */
const stopSignBoxes = ref<BoundingBox[]>([])

/** Bounding box covering all cached traffic data */
const trafficCoverageBbox = ref<BoundingBox | null>(null)

/** Cached traffic flow response */
const cachedTrafficFlow = ref<FlowResponse | null>(null)

/** Stop sign detection cache (lat,lng key -> boolean) */
const stopSignCache = ref<Map<string, boolean>>(new Map())

/** Avoid zone snapshots per iteration (for heuristics) */
const iterationSnapshots = ref<Map<number, AvoidSnapshot>>(new Map())

// ─────────────────────────────────────────────────────────────────────────────
// Cache Key Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate cache key from coordinates with precision rounding
 * @param lat Latitude
 * @param lng Longitude
 * @param precision Number of decimal places (5 ≈ 1m accuracy)
 */
function getCacheKey(lat: number, lng: number, precision = 5): string {
  const roundedLat = lat.toFixed(precision)
  const roundedLng = lng.toFixed(precision)
  return `${roundedLat},${roundedLng}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect stop sign with caching
 */
async function detectStopSignCached(
  point: RoutePoint,
  heading: number,
  conf = 0.25,
): Promise<boolean> {
  const cacheKey = getCacheKey(point.lat, point.lng)

  // Check cache first
  if (stopSignCache.value.has(cacheKey)) {
    const cached = stopSignCache.value.get(cacheKey)!
    return cached
  }

  // Cache miss - call API
  const result = await detectStopSign(point, heading, conf)

  // Store in cache
  stopSignCache.value.set(cacheKey, result)

  return result
}

/**
 * Add traffic segments to avoid (merges with existing, dedupes by ID)
 */
function addTrafficSegments(segments: PrioritizedSegment[]) {
  const existingIds = new Set(trafficSegments.value.map((s) => s.id))
  trafficSegments.value.push(...segments.filter((s) => !existingIds.has(s.id)))

  const { drawTrafficSegments } = useMapStore()
  drawTrafficSegments(trafficSegments.value)
}

/**
 * Add stop sign bounding boxes to avoid
 */
function addStopSignBoxes(boxes: BoundingBox[]) {
  stopSignBoxes.value.push(...boxes)
  const { drawStopSigns } = useMapStore()
  drawStopSigns(stopSignBoxes.value)
}

/**
 * Get cleaned segment IDs, sorted by priority and limited to max
 */
function getCleanedSegments(maxSegments = 250, routes: Route[] = []): string[] {
  // 1. Deduplicate segments first to avoid redundant intersection checks
  const uniqueSegments = new Map<string, PrioritizedSegment>()
  for (const seg of trafficSegments.value) {
    if (!uniqueSegments.has(seg.id)) {
      uniqueSegments.set(seg.id, seg)
    }
  }
  const allSegments = Array.from(uniqueSegments.values())

  // 2. If no routes provided, just sort by priority
  if (routes.length === 0) {
    const sorted = allSegments.sort((a, b) => b.priority - a.priority)
    return sorted.slice(0, maxSegments).map((s) => s.id)
  }

  // 3. Separate into intersecting vs non-intersecting using optimized BBox check
  const { intersecting, others } = findIntersectingSegments(allSegments, routes, 20)

  // 4. Sort both lists by priority (descending)
  intersecting.sort((a, b) => b.priority - a.priority)
  others.sort((a, b) => b.priority - a.priority)

  // 5. Combine: Intersecting first, then others
  const result: string[] = []
  const combined = [...intersecting, ...others]

  for (const seg of combined) {
    if (result.length >= maxSegments) break
    result.push(seg.id)
  }

  return result
}

/**
 * Take a snapshot of current avoid zones for an iteration
 */
function takeSnapshot(iteration: number, routes: Route[] = []): void {
  const snapshot: AvoidSnapshot = {
    segments: getCleanedSegments(250, routes),
    stopSignBoxes: [...stopSignBoxes.value],
    timestamp: Date.now(),
  }

  iterationSnapshots.value.set(iteration, snapshot)
}

/**
 * Get a snapshot for a specific iteration
 */
function getSnapshot(iteration: number): AvoidSnapshot | undefined {
  return iterationSnapshots.value.get(iteration)
}

/**
 * Clear all avoid zones
 */
function clearAvoidZones() {
  trafficSegments.value = []
  stopSignBoxes.value = []
  const { clearTrafficSegments, clearStopSigns } = useMapStore()
  clearTrafficSegments()
  clearStopSigns()
}

/**
 * Get the current traffic coverage bounding box
 */
function getTrafficCoverageBbox(): BoundingBox | null {
  return trafficCoverageBbox.value
}

/**
 * Set the traffic coverage bounding box
 */
function setTrafficCoverageBbox(bbox: BoundingBox): void {
  trafficCoverageBbox.value = bbox
  const { drawDebugBoundingBox } = useMapStore()
  drawDebugBoundingBox(bbox)
}

/**
 * Get cached traffic flow data
 */
function getCachedTrafficFlow(): FlowResponse | null {
  return cachedTrafficFlow.value
}

/**
 * Set cached traffic flow data
 */
function setCachedTrafficFlow(flow: FlowResponse | null): void {
  cachedTrafficFlow.value = flow
}

/**
 * Clear traffic cache (bbox and flow data)
 */
function clearTrafficCache(): void {
  trafficCoverageBbox.value = null
  cachedTrafficFlow.value = null
  const { clearDebugBoundingBox } = useMapStore()
  clearDebugBoundingBox()
}

/**
 * Clear all avoidance data including caches and snapshots
 */
function clearAll(): void {
  clearAvoidZones()
  clearTrafficCache()
  stopSignCache.value.clear()
  iterationSnapshots.value.clear()
}

// ─────────────────────────────────────────────────────────────────────────────
// Composable Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Composable for accessing avoidance store state and actions
 */
export function useAvoidanceStore() {
  return {
    // State
    trafficSegments,
    stopSignBoxes,
    trafficCoverageBbox,
    cachedTrafficFlow,
    stopSignCache,
    iterationSnapshots,

    // Actions
    detectStopSignCached,
    addTrafficSegments,
    addStopSignBoxes,
    getCleanedSegments,
    takeSnapshot,
    getSnapshot,
    clearAvoidZones,
    getTrafficCoverageBbox,
    setTrafficCoverageBbox,
    getCachedTrafficFlow,
    setCachedTrafficFlow,
    clearTrafficCache,
    clearAll,
  }
}
