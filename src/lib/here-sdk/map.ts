/**
 * HERE Maps Map Utilities
 * Functions for creating and configuring map instances
 */



import { createDefaultLayers } from './layers'

export interface MapOptions {
  /** Container element or element ID */
  container: HTMLElement | string
  /** Initial center coordinates */
  center?: { lat: number; lng: number }
  /** Initial zoom level (1-20) */
  zoom?: number
  /** Initial tilt angle in degrees (0-60 for HARP) */
  tilt?: number
  /** Initial heading/bearing in degrees */
  heading?: number
  /** Enable map interactions (pan, zoom, rotate) */
  interactive?: boolean
  /** Show default UI controls */
  showControls?: boolean
  /** Pixel ratio for high-DPI displays */
  pixelRatio?: number
}

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
    center = { lat: 37.7749, lng: -122.4194 }, // San Francisco default
    zoom = 14,
    tilt = 45,
    heading = 0,
    interactive = true,
    showControls = true,
    pixelRatio = window.devicePixelRatio || 1,
  } = options

  // Get container element
  const element =
    typeof container === 'string'
      ? document.getElementById(container)
      : container

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
    heading,
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
