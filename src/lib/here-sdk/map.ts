/**
 * HERE Maps Map Utilities
 * Functions for creating and configuring map instances
 */

import type { MapOptions } from '@/entities'

import { createDefaultLayers } from './layers'

// Re-export type for convenience

// MapInstance remains local since it contains runtime objects (H.Map, etc.)
export interface MapInstance {
  map: H.Map
  behavior: H.mapevents.Behavior | null
  ui: H.ui.UI | null
  dispose: () => void
}

/**
 * Create a new HERE Map with HARP engine and modern styling
 */
export function createMap(options: MapOptions): MapInstance {
  const {
    container,
    center = { lat: 49.2827, lng: -123.1207 }, // Vancouver default
    zoom = 12,
    tilt = 45,
    heading = 0,
    interactive = true,
    showControls = true,
    pixelRatio = window.devicePixelRatio || 1,
  } = options

  // Get container element
  const element = typeof container === 'string' ? document.getElementById(container) : container

  if (!element) {
    throw new Error('Map container element not found')
  }

  // Create default layers with HARP engine
  const defaultLayers = createDefaultLayers()

  // Create the map instance
  const map = new H.Map(element, defaultLayers.vector.normal.map, {
    center: { lat: center.lat, lng: center.lng },
    zoom,
    pixelRatio,
    engineType: H.Map.EngineType.HARP,
  })

  // Set initial view angle
  map.getViewModel().setLookAtData({
    tilt,
    // Offset heading by 180 degrees to align 0 with North-Up
    heading: (heading + 180) % 360,
  })

  // Enable interactions
  let behavior: H.mapevents.Behavior | null = null
  if (interactive) {
    const mapEvents = new H.mapevents.MapEvents(map)
    behavior = new H.mapevents.Behavior(mapEvents)
  }

  // Create UI controls
  let ui: H.ui.UI | null = null
  if (showControls) {
    ui = H.ui.UI.createDefault(map, defaultLayers)

    // Position zoom control
    const zoomControl = ui.getControl('zoom')
    if (zoomControl) {
      zoomControl.setAlignment(H.ui.LayoutAlignment.RIGHT_MIDDLE)
    }
  }

  // Handle window resize
  const handleResize = () => {
    map.getViewPort().resize()
  }
  window.addEventListener('resize', handleResize)

  // Dispose function for cleanup
  const dispose = () => {
    window.removeEventListener('resize', handleResize)
    ui?.dispose()
    behavior?.dispose()
    map.dispose()
  }

  return {
    map,
    behavior,
    ui,
    dispose,
  }
}
