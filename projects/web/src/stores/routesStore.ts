import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { BBox, Route, StopSign, TrafficSegment } from '@/entities'
import { createBBox } from '@/utils/geo'
import { scoreRoute } from '@/utils/scoring'

import { useMapStore } from './mapStore'

/** Store for managing routes, traffic segments, and stop signs */
export const useRoutesStore = defineStore('routes', () => {
  const routes = ref<Route[]>([])
  const selectedIndex = ref(0)
  const trafficSegments = ref<TrafficSegment[]>([])
  const stopSigns = ref<StopSign[]>([])

  const stopSignBoxes = computed<BBox[]>(() => stopSigns.value.map((s) => createBBox(s, 20)))
  const selectedRoute = computed(() => routes.value[selectedIndex.value])

  /** Add routes to the store, deduplicating by polyline */
  function setRoutes(newRoutes: Route[]) {
    const seen = new Set(routes.value.map((r) => r.sections[0]?.polyline).filter(Boolean))

    const unique = newRoutes.filter((r) => {
      const poly = r.sections[0]?.polyline
      if (!poly || seen.has(poly)) return false
      seen.add(poly)
      return true
    })

    if (unique.length === 0) return false

    routes.value.push(...unique)
    const mapStore = useMapStore()
    mapStore.drawRoutes({ routes: routes.value })
    return true
  }

  /** Select a route by index */
  function select(index: number) {
    if (index < 0 || index >= routes.value.length) return
    selectedIndex.value = index
    useMapStore().selectRoute(index)
  }

  /** Clear all routes and avoidance data */
  function clear() {
    routes.value = []
    selectedIndex.value = 0
    trafficSegments.value = []
    stopSigns.value = []
    useMapStore().clearRoutes()
  }

  /** Recalculate scores for all routes based on current traffic and stop sign data */
  function recalculateScores() {
    for (const route of routes.value) {
      const { score, violations } = scoreRoute(route, trafficSegments.value, stopSigns.value)
      route.score = score
      route.violations = violations
    }
    console.log(`[RoutesStore] Recalculated scores for ${routes.value.length} routes`)
  }

  /** Add traffic segments to avoid, deduplicating by ID */
  function addTrafficSegments(segments: TrafficSegment[]) {
    const existing = new Set(trafficSegments.value.map((s) => s.id))
    const newSegments = segments.filter((s) => !existing.has(s.id))
    trafficSegments.value.push(...newSegments)
  }

  /** Add stop signs to avoid, deduplicating by coordinates */
  function addStopSigns(signs: StopSign[]) {
    const existing = new Set(stopSigns.value.map((s) => `${s.lat},${s.lng}`))
    const newSigns = signs.filter((s) => !existing.has(`${s.lat},${s.lng}`))
    stopSigns.value.push(...newSigns)
  }

  /** Get segment IDs to avoid, sorted by priority */
  function getSegmentsToAvoid(max = 250): string[] {
    return trafficSegments.value
      .sort((a, b) => b.priority - a.priority)
      .slice(0, max)
      .map((s) => s.id)
  }

  return {
    routes,
    selectedIndex,
    trafficSegments,
    stopSigns,
    stopSignBoxes,
    selectedRoute,
    setRoutes,
    select,
    clear,
    recalculateScores,
    addTrafficSegments,
    addStopSigns,
    getSegmentsToAvoid,
  }
})
