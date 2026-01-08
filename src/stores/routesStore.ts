/**
 * Routes Store
 * Manages the application's route data using a singleton state pattern.
 */

import { ref } from 'vue'

import type { Route } from '@/entities'
import { useMapStore } from '@/stores/mapStore'

// ─────────────────────────────────────────────────────────────────────────────
// Shared State
// ─────────────────────────────────────────────────────────────────────────────

/** The shared list of routes */
const routes = ref<Route[]>([])

/** Currently selected route index */
const selectedRouteIndex = ref(0)

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Replace the current routes with a new set
 */
function setRoutes(newRoutes: Route[]) {
  routes.value.push(...newRoutes)
  console.log('[RoutesStore] Set routes:', routes.value)
  const { drawRoutes } = useMapStore()
  drawRoutes({ routes: routes.value })
}

/**
 * Clear all routes
 */
function clearRoutes() {
  const { clearRoutesFromMap } = useMapStore()
  routes.value = []
  selectedRouteIndex.value = 0
  clearRoutesFromMap()
  console.log('[RoutesStore] Routes cleared')
}

/**
 * Select a different route by index
 */
function selectRoute(index: number) {
  if (index < 0 || index >= routes.value.length) {
    console.warn(`[RoutesStore] Invalid route index: ${index}`)
    return
  }

  const { setSelectedRouteOnMap } = useMapStore()
  selectedRouteIndex.value = index
  setSelectedRouteOnMap(index)
  console.log(`[RoutesStore] Selected route ${index}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Composable Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Composable for accessing routes store state and actions
 */
export function useRoutesStore() {
  return {
    // State
    routes,
    selectedRouteIndex,

    // Actions
    setRoutes,
    clearRoutes,
    selectRoute,
  }
}
