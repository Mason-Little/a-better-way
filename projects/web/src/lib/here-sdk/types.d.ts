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
          onError: (error: Error) => void,
        ): void
        geocode(
          params: GeocodingService.Params,
          onSuccess: (result: GeocodingService.Result) => void,
          onError: (error: Error) => void,
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
          onError: (error: Error) => void,
        ): void
      }

      namespace RoutingService8 {
        interface CalculateRouteParams {
          routingMode: 'fast' | 'short'
          transportMode: 'car' | 'truck' | 'pedestrian' | 'bicycle' | 'scooter'
          origin: string
          destination: string
          return?: string
          spans?: string
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
          onError: (error: Error) => void,
        ): void
        reverseGeocode(
          params: GeocodingService.ReverseParams,
          onSuccess: (result: GeocodingService.Result) => void,
          onError: (error: Error) => void,
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
      constructor(element: HTMLElement, layer: map.layer.Layer, options?: Map.Options)
      dispose(): void
      getViewModel(): map.ViewModel
      setCenter(center: geo.IPoint, animate?: boolean): void
      setZoom(zoom: number, animate?: boolean): void
      getViewPort(): map.ViewPort
      addLayer(layer: map.layer.Layer): void
      removeLayer(layer: map.layer.Layer): void
      setBaseLayer(layer: map.layer.Layer): void
      getEngine(): unknown

      // Object management
      addObject(object: map.Object): void
      addObjects(objects: map.Object[]): void
      removeObject(object: map.Object): boolean
      removeObjects(objects: map.Object[]): void
      getObjects(): map.Object[]

      // Viewport bounds
      getViewBounds(): geo.Rect
      setViewBounds(bounds: geo.Rect, animate?: boolean): void
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
        P2D = 'P2D',
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

      /**
       * A geographic rectangle defined by top-left and bottom-right corners
       */
      class Rect {
        constructor(top: number, left: number, bottom: number, right: number)
        getTop(): number
        getLeft(): number
        getBottom(): number
        getRight(): number
        getTopLeft(): Point
        getBottomRight(): Point
        mergeRect(rect: Rect): Rect
        containsPoint(point: IPoint): boolean
      }

      /**
       * A sequence of geographic points forming a line or polygon
       */
      class LineString {
        constructor()
        pushPoint(point: IPoint): void
        getPointCount(): number
        getBoundingBox(): Rect | null

        /**
         * Decode a HERE flexible polyline string into a LineString
         * @param polyline Encoded flexible polyline string from HERE Routing API
         */
        static fromFlexiblePolyline(polyline: string): LineString
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
          /** Bounding box to fit in viewport (HARP engine) */
          bounds?: geo.Rect
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

      /**
       * Base class for map objects (markers, polylines, polygons, groups)
       */
      abstract class Object {
        getParentGroup(): Group | null
        setVisibility(visibility: boolean): void
        getVisibility(): boolean
        dispose(): void
        setData(data: unknown): void
        getData(): unknown
      }

      /**
       * Style options for stroke/line rendering
       */
      interface SpatialStyle {
        /** Stroke/line color (CSS color string) */
        strokeColor?: string
        /** Fill color for polygons */
        fillColor?: string
        /** Line width in pixels */
        lineWidth?: number
        /** Line cap style */
        lineCap?: 'butt' | 'round' | 'square'
        /** Line join style */
        lineJoin?: 'miter' | 'round' | 'bevel'
        /** Miter limit for sharp corners */
        miterLimit?: number
        /** Line dash pattern */
        lineDash?: number[]
        /** Line dash offset */
        lineDashOffset?: number
      }

      /**
       * Options for creating a Polyline
       */
      interface PolylineOptions {
        /** Style for the polyline */
        style?: SpatialStyle
        /** Custom data to attach */
        data?: unknown
        /** Whether the polyline is visible */
        visibility?: boolean
        /** Z-index for layer ordering */
        zIndex?: number
        /** Minimum zoom level for visibility */
        min?: number
        /** Maximum zoom level for visibility */
        max?: number
      }

      /**
       * A polyline rendered on the map
       */
      class Polyline extends Object {
        constructor(geometry: geo.LineString, options?: PolylineOptions)
        getGeometry(): geo.LineString
        setGeometry(geometry: geo.LineString): void
        setStyle(style: SpatialStyle): void
        getStyle(): SpatialStyle
      }

      /**
       * Options for creating a Polygon
       */
      interface PolygonOptions {
        /** Style for the polygon */
        style?: SpatialStyle
        /** Custom data to attach */
        data?: unknown
        /** Whether the polygon is visible */
        visibility?: boolean
        /** Z-index for layer ordering */
        zIndex?: number
        /** Minimum zoom level for visibility */
        min?: number
        /** Maximum zoom level for visibility */
        max?: number
      }

      /**
       * A polygon rendered on the map
       */
      class Polygon extends Object {
        constructor(geometry: geo.LineString, options?: PolygonOptions)
        getGeometry(): geo.LineString
        setGeometry(geometry: geo.LineString): void
        setStyle(style: SpatialStyle): void
        getStyle(): SpatialStyle
      }

      /**
       * A rectangle rendered on the map
       */
      class Rect extends Object {
        constructor(geometry: geo.Rect, options?: PolygonOptions)
        getGeometry(): geo.Rect
        setGeometry(geometry: geo.Rect): void
        setStyle(style: SpatialStyle): void
        getStyle(): SpatialStyle
      }

      /**
       * A group of map objects for organization and batch operations
       */
      class Group extends Object {
        constructor(options?: { objects?: Object[]; min?: number; max?: number })
        addObject(object: Object): void
        addObjects(objects: Object[]): void
        removeObject(object: Object): boolean
        removeObjects(objects: Object[]): void
        removeAll(): void
        getObjects(): Object[]
        getBoundingBox(): geo.Rect | null
        forEach(callback: (object: Object, index: number, group: Group) => void): void
      }

      /**
       * Icon for markers
       */
      class Icon {
        constructor(bitmap: string | HTMLElement, options?: Icon.Options)
      }

      namespace Icon {
        interface Options {
          /** Icon size */
          size?: { w: number; h: number }
          /** Anchor point relative to top-left */
          anchor?: { x: number; y: number }
          /** Whether to hit-test the icon */
          hitArea?: { type: 'rect' | 'circle'; width?: number; height?: number; radius?: number }
        }
      }

      /**
       * A marker placed on the map
       */
      class Marker extends Object {
        constructor(position: geo.IPoint, options?: Marker.Options)
        getGeometry(): geo.Point
        setGeometry(position: geo.IPoint): void
        setIcon(icon: Icon): void
        getIcon(): Icon | null
      }

      namespace Marker {
        interface Options {
          /** Icon to display */
          icon?: Icon
          /** Minimum zoom for visibility */
          min?: number
          /** Maximum zoom for visibility */
          max?: number
          /** Z-index */
          zIndex?: number
          /** Custom data */
          data?: unknown
        }
      }

      /**
       * DOM-based icon for DomMarker
       * Allows for rich HTML/CSS styling and animations
       */
      class DomIcon {
        constructor(element: HTMLElement | string, options?: DomIcon.Options)
      }

      namespace DomIcon {
        interface Options {
          /** Function to handle state changes (e.g., hover) */
          onAttach?: (clonedElement: HTMLElement, domIcon: DomIcon, domMarker: DomMarker) => void
          /** Function called when the icon is detached from a marker */
          onDetach?: (clonedElement: HTMLElement, domIcon: DomIcon, domMarker: DomMarker) => void
        }
      }

      /**
       * A DOM-based marker that renders as an HTML element
       * Useful for rich, interactive, or animated markers
       */
      class DomMarker extends Object {
        constructor(position: geo.IPoint, options?: DomMarker.Options)
        getGeometry(): geo.Point
        setGeometry(position: geo.IPoint): void
        setIcon(icon: DomIcon): void
        getIcon(): DomIcon | null
      }

      namespace DomMarker {
        interface Options {
          /** DomIcon to display */
          icon?: DomIcon
          /** Minimum zoom for visibility */
          min?: number
          /** Maximum zoom for visibility */
          max?: number
          /** Z-index */
          zIndex?: number
          /** Custom data */
          data?: unknown
        }
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
          HEADING = 6,
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
        BOTTOM_RIGHT = 'bottom-right',
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
