/**
 * Avoidance Store
 * Manages traffic segments, stop signs, and avoidance caching using a singleton state pattern.
 */

import { computed, ref } from 'vue'

import type {
  BoundingBox,
  FlowResponse,
  PrioritizedSegment,
  Route,
  RoutePoint,
  StopSign,
} from '@/entities'
import { useMapStore } from '@/stores/mapStore'
import { createBoundingBox } from '@/utils/geo'
import { detectStopSign } from '@/utils/stop-sign/stop-sign-recognition'
import { findMatchingSegments } from '@/utils/traffic/matcher'

// ─────────────────────────────────────────────────────────────────────────────
// Shared State
// ─────────────────────────────────────────────────────────────────────────────

/** Accumulated traffic segments to avoid (with priority info) */
const trafficSegments = ref<PrioritizedSegment[]>([])

/** Accumulated stop signs to avoid */
const stopSigns = ref<StopSign[]>([])

/** Accumulated stop sign bounding boxes to avoid (computed on demand) */
const stopSignBoxes = computed<BoundingBox[]>(() =>
  stopSigns.value.map((s) => createBoundingBox(s, 20)),
)

/** Bounding box covering all cached traffic data */
const trafficCoverageBbox = ref<BoundingBox | null>(null)

/** Cached traffic flow response */
const cachedTrafficFlow = ref<FlowResponse | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Cache Key Generation
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect stop sign
 */
async function detectStopSignCached(
  point: RoutePoint,
  heading: number,
  conf = 0.25,
): Promise<boolean> {
  return await detectStopSign(point, heading, conf)
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
 * Add stop signs to avoid (merges with existing, dedupes by coordinates)
 */
function addStopSigns(signs: StopSign[]) {
  // Simple deduplication by coordinate string (exact match)
  const existingKeys = new Set(stopSigns.value.map((s) => `${s.lat},${s.lng}`))
  const newSigns = signs.filter((s) => !existingKeys.has(`${s.lat},${s.lng}`))

  if (newSigns.length === 0) return

  stopSigns.value.push(...newSigns)
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

  // 3. Separate into intersecting vs non-intersecting using segments IDs
  const { matches: intersecting, others } = findMatchingSegments(allSegments, routes)

  console.log(`Found ${intersecting.length} intersecting segments and ${others.length} others`)

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
 * Clear all avoid zones
 */
function clearAvoidZones() {
  trafficSegments.value = []
  stopSigns.value = []
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
 * Clear all avoidance data including caches
 */
function clearAll(): void {
  clearAvoidZones()
  clearTrafficCache()
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
    stopSigns,
    stopSignBoxes,
    trafficCoverageBbox,
    cachedTrafficFlow,

    // Actions
    detectStopSignCached,
    addTrafficSegments,
    addStopSigns,
    getCleanedSegments,
    clearAvoidZones,
    getTrafficCoverageBbox,
    setTrafficCoverageBbox,
    getCachedTrafficFlow,
    setCachedTrafficFlow,
    clearTrafficCache,
    clearAll,
  }
}
