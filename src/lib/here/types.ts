/**
 * HERE Maps API TypeScript declarations
 * Minimal types for our usage - the full API is much larger
 */

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace H {
    namespace Map {
      interface Options {
        center: { lat: number; lng: number }
        zoom: number
        pixelRatio?: number
      }
    }

    class Map {
      constructor(container: HTMLElement, baseLayer: H.map.layer.Layer, options?: Map.Options)
      getBaseLayer(): H.map.layer.Layer
      setBaseLayer(layer: H.map.layer.Layer): void
      getCenter(): { lat: number; lng: number }
      setCenter(center: { lat: number; lng: number }, animate?: boolean): void
      getZoom(): number
      setZoom(zoom: number, animate?: boolean): void
      addObject(object: H.map.Object): void
      removeObject(object: H.map.Object): void
      removeObjects(objects: H.map.Object[]): void
      getObjects(): H.map.Object[]
      getViewModel(): H.map.ViewModel
      dispose(): void
    }

    namespace map {
      class Object {}

      class Polyline extends Object {
        constructor(lineString: H.geo.LineString, options?: { style?: { strokeColor?: string; lineWidth?: number } })
      }

      class Marker extends Object {
        constructor(coords: { lat: number; lng: number }, options?: { icon?: H.map.Icon })
      }

      class Icon {
        constructor(bitmap: string | HTMLElement, options?: { size?: { w: number; h: number } })
      }

      class ViewModel {
        setLookAtData(data: { position?: { lat: number; lng: number }; zoom?: number }): void
      }

      namespace layer {
        class Layer {}
        class TileLayer extends Layer {}
      }
    }

    namespace geo {
      class LineString {
        constructor()
        pushPoint(point: { lat: number; lng: number }): void
        static fromFlexiblePolyline(encoded: string): LineString
      }
    }

    namespace service {
      interface PlatformOptions {
        apikey: string
      }

      class Platform {
        constructor(options: PlatformOptions)
        createDefaultLayers(): DefaultLayers
      }

      interface DefaultLayers {
        vector: {
          normal: {
            map: H.map.layer.Layer
          }
        }
        raster: {
          normal: {
            map: H.map.layer.Layer
          }
        }
      }
    }

    namespace ui {
      class UI {
        static createDefault(map: H.Map, layers: H.service.DefaultLayers): UI
        dispose(): void
      }
    }

    namespace mapevents {
      class MapEvents {
        constructor(map: H.Map)
        dispose(): void
      }

      class Behavior {
        constructor(mapEvents: MapEvents)
        disable(): void
        enable(): void
        dispose(): void
      }
    }
  }
}

export {}
