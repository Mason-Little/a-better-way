/**
 * HERE Maps SDK Type Definitions
 * Provides TypeScript support for the HERE Maps JavaScript API
 */

// Extend the global Window interface
declare global {
  interface Window {
    H: typeof H
  }

  // HERE Maps API Namespace
  namespace H {
    namespace service {
      class Platform {
        constructor(options: Platform.Options)
        createDefaultLayers(options?: Platform.DefaultLayersOptions): Platform.DefaultLayers
        getSearchService(): service.SearchService
        getRoutingService(baseUrl: null, version: 8): service.RoutingService8
      }

      namespace Platform {
        interface Options {
          apikey: string
        }

        interface DefaultLayersOptions {
          engineType?: Map.EngineType
          lg?: string
          pois?: boolean
        }

        interface DefaultLayers {
          vector: {
            normal: {
              map: map.layer.Layer
              truck: map.layer.Layer
              traffic: map.layer.Layer
              trafficincidents: map.layer.Layer
            }
          }
          raster: {
            normal: {
              map: map.layer.Layer
              base: map.layer.Layer
              xbase: map.layer.Layer
            }
            satellite: {
              map: map.layer.Layer
              base: map.layer.Layer
              xbase: map.layer.Layer
            }
            terrain: {
              map: map.layer.Layer
              base: map.layer.Layer
              xbase: map.layer.Layer
            }
          }
        }
      }

      class SearchService {
        autosuggest(
          params: SearchService.Params,
          onSuccess: (result: SearchService.Result) => void,
          onError: (error: Error) => void
        ): void
        geocode(
          params: GeocodingService.Params,
          onSuccess: (result: GeocodingService.Result) => void,
          onError: (error: Error) => void
        ): void
      }

      namespace SearchService {
        interface Params {
          q: string
          at: string
          limit?: number
        }

        interface Result {
          items: Array<{
            id: string
            title: string
            address: {
              label: string
            }
            position?: {
              lat: number
              lng: number
            }
          }>
        }
      }

      // Routing Service v8
      class RoutingService8 {
        calculateRoute(
          params: RoutingService8.CalculateRouteParams,
          onSuccess: (result: unknown) => void,
          onError: (error: Error) => void
        ): void
      }

      namespace RoutingService8 {
        interface CalculateRouteParams {
          routingMode: 'fast' | 'short'
          transportMode: 'car' | 'truck' | 'pedestrian' | 'bicycle' | 'scooter'
          origin: string
          destination: string
          return?: string
          departureTime?: string
          alternatives?: number
          via?: string[]
          avoid?: {
            features?: string[]
            areas?: string[]
          }
        }
      }

      // Geocoding Service
      class GeocodingService {
        geocode(
          params: GeocodingService.Params,
          onSuccess: (result: GeocodingService.Result) => void,
          onError: (error: Error) => void
        ): void
        reverseGeocode(
          params: GeocodingService.ReverseParams,
          onSuccess: (result: GeocodingService.Result) => void,
          onError: (error: Error) => void
        ): void
      }

      namespace GeocodingService {
        interface Params {
          q: string
          limit?: number
        }

        interface ReverseParams {
          at: string
          limit?: number
        }

        interface Result {
          items: Array<{
            title: string
            id: string
            address: {
              label: string
              city?: string
              state?: string
              countryCode?: string
              postalCode?: string
            }
            position?: {
              lat: number
              lng: number
            }
          }>
        }
      }
    }

    class Map {
      constructor(
        element: HTMLElement,
        layer: map.layer.Layer,
        options?: Map.Options
      )
      dispose(): void
      getViewModel(): map.ViewModel
      setCenter(center: geo.IPoint, animate?: boolean): void
      setZoom(zoom: number, animate?: boolean): void
      getViewPort(): map.ViewPort
      addLayer(layer: map.layer.Layer): void
      removeLayer(layer: map.layer.Layer): void
      setBaseLayer(layer: map.layer.Layer): void
      getEngine(): unknown
    }

    namespace Map {
      interface Options {
        center?: geo.IPoint
        zoom?: number
        pixelRatio?: number
        padding?: map.ViewPort.Padding
        engineType?: EngineType
      }

      enum EngineType {
        HARP = 'HARP',
        WEBGL = 'WEBGL',
        P2D = 'P2D'
      }
    }

    namespace geo {
      interface IPoint {
        lat: number
        lng: number
      }

      class Point implements IPoint {
        constructor(lat: number, lng: number, alt?: number)
        lat: number
        lng: number
        alt?: number
      }
    }

    namespace map {
      class ViewModel {
        setLookAtData(data: ViewModel.ILookAtData, animate?: boolean): void
        getLookAtData(): ViewModel.ILookAtData
      }

      namespace ViewModel {
        interface ILookAtData {
          position?: geo.IPoint
          zoom?: number
          tilt?: number
          heading?: number
        }
      }

      class ViewPort {
        resize(): void
      }

      namespace ViewPort {
        interface Padding {
          top?: number
          right?: number
          bottom?: number
          left?: number
        }
      }

      namespace layer {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface Layer {}
      }
    }

    namespace mapevents {
      class MapEvents {
        constructor(map: Map)
        dispose(): void
      }

      class Behavior {
        constructor(mapEvents: MapEvents, options?: Behavior.Options)
        dispose(): void
        enable(feature?: Behavior.Feature): void
        disable(feature?: Behavior.Feature): void
      }

      namespace Behavior {
        interface Options {
          enabled?: number
        }

        enum Feature {
          PANNING = 0,
          PINCH_ZOOM = 1,
          WHEEL_ZOOM = 2,
          DBL_TAP_ZOOM = 3,
          FRACTIONAL_ZOOM = 4,
          TILT = 5,
          HEADING = 6
        }
      }
    }

    namespace ui {
      class UI {
        static createDefault(map: Map, defaultLayers: service.Platform.DefaultLayers): UI
        dispose(): void
        getControl(name: string): Control | undefined
        addControl(name: string, control: Control): void
        removeControl(name: string): void
      }

      class Control {
        setAlignment(alignment: LayoutAlignment): void
      }

      enum LayoutAlignment {
        TOP_LEFT = 'top-left',
        TOP_CENTER = 'top-center',
        TOP_RIGHT = 'top-right',
        LEFT_TOP = 'left-top',
        LEFT_MIDDLE = 'left-middle',
        LEFT_BOTTOM = 'left-bottom',
        RIGHT_TOP = 'right-top',
        RIGHT_MIDDLE = 'right-middle',
        RIGHT_BOTTOM = 'right-bottom',
        BOTTOM_LEFT = 'bottom-left',
        BOTTOM_CENTER = 'bottom-center',
        BOTTOM_RIGHT = 'bottom-right'
      }

      class ZoomControl extends Control {
        constructor(options?: ZoomControl.Options)
      }

      namespace ZoomControl {
        interface Options {
          slider?: boolean
          sliderSnaps?: boolean
          zoomSpeed?: number
        }
      }

      class ScaleBar extends Control {
        constructor(options?: ScaleBar.Options)
      }

      namespace ScaleBar {
        interface Options {
          alignment?: LayoutAlignment
        }
      }
    }
  }
}

export {}
