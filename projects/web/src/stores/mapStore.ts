import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import type { RouteResponse } from '@/entities'
import { RouteRenderer } from '@/lib/here-sdk/routeRenderer'

/** Store for managing the shared HERE Map instance and route rendering */
export const useMapStore = defineStore('map', () => {
  const map = shallowRef<H.Map | null>(null)
  const layers = shallowRef<H.service.Platform.DefaultLayers | null>(null)
  const renderer = shallowRef<RouteRenderer | null>(null)
  const isLoading = ref(false)

  /** Register a map instance with the store */
  function register(instance: { map: H.Map; layers: H.service.Platform.DefaultLayers }) {
    map.value = instance.map
    layers.value = instance.layers
    renderer.value = new RouteRenderer(instance.map)
  }

  /** Unregister and clean up the map instance */
  function unregister() {
    renderer.value?.clearRoutes()
    renderer.value = null
    map.value = null
    layers.value = null
  }

  /** Draw routes on the map */
  function drawRoutes(response: RouteResponse, selectedIndex = 0) {
    if (!renderer.value) {
      console.warn('[MapStore] No renderer - map not initialized')
      return
    }
    renderer.value.drawRoutes(response, selectedIndex)
  }

  /** Select a route by index */
  function selectRoute(index: number) {
    renderer.value?.setSelectedRoute(index)
  }

  /** Clear all routes from the map */
  function clearRoutes() {
    renderer.value?.clearRoutes()
  }

  /** Update the map camera view */
  function setView(options: {
    center?: { lat: number; lng: number }
    zoom?: number
    tilt?: number
    heading?: number
    animate?: boolean
  }) {
    if (!map.value) return

    const { center, zoom, heading, tilt, animate = true } = options
    const vm = map.value.getViewModel()
    const current = vm.getLookAtData()

    vm.setLookAtData(
      {
        position: center ?? current.position,
        zoom: zoom ?? current.zoom,
        heading: heading ?? current.heading,
        tilt: tilt ?? current.tilt,
      },
      animate,
    )
  }

  return {
    map,
    layers,
    isLoading,
    register,
    unregister,
    drawRoutes,
    selectRoute,
    clearRoutes,
    setView,
  }
})
