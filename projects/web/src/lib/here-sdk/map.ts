import type { MapOptions } from '@/entities'

import { createDefaultLayers } from './layers'

export interface MapInstance {
  map: H.Map
  behavior: H.mapevents.Behavior | null
  ui: H.ui.UI | null
  layers: H.service.Platform.DefaultLayers
  dispose: () => void
}

/** Create a new HERE Map instance with HARP engine and controls */
export function createMap(options: MapOptions): MapInstance {
  const {
    container,
    center = { lat: 49.2827, lng: -123.1207 },
    zoom = 12,
    tilt = 45,
    heading = 0,
    interactive = true,
    showControls = true,
    pixelRatio = window.devicePixelRatio || 1,
  } = options

  const element = typeof container === 'string' ? document.getElementById(container) : container
  if (!element) throw new Error('Map container element not found')

  const defaultLayers = createDefaultLayers()

  const map = new H.Map(element, defaultLayers.vector.normal.map, {
    center: { lat: center.lat, lng: center.lng },
    zoom,
    pixelRatio,
    engineType: H.Map.EngineType.HARP,
  })

  map.getViewModel().setLookAtData({
    tilt,
    heading: (heading + 180) % 360,
  })

  let behavior: H.mapevents.Behavior | null = null
  if (interactive) {
    const mapEvents = new H.mapevents.MapEvents(map)
    behavior = new H.mapevents.Behavior(mapEvents)
  }

  let ui: H.ui.UI | null = null
  if (showControls) {
    ui = H.ui.UI.createDefault(map, defaultLayers)
    const zoomControl = ui.getControl('zoom')
    if (zoomControl) zoomControl.setAlignment(H.ui.LayoutAlignment.RIGHT_MIDDLE)
  }

  const handleResize = () => map.getViewPort().resize()
  window.addEventListener('resize', handleResize)

  const dispose = () => {
    window.removeEventListener('resize', handleResize)
    ui?.dispose()
    behavior?.dispose()
    map.dispose()
  }

  return { map, behavior, ui, layers: defaultLayers, dispose }
}
