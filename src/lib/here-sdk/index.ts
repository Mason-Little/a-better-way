/**
 * HERE SDK
 * Clean wrapper for HERE Maps JavaScript API
 */

// Types
export type { MapOptions, MapInstance } from './map'
export type { DefaultLayerOptions } from './layers'
export type { RoutePoint, Route, RouteSection, RoutingOptions, RoutingResult } from './route'
export type { PuckOptions, PuckPosition } from './puck'

// Platform
export { getPlatform, resetPlatform } from './platform'

// Layers
export { createDefaultLayers, getVectorLayer } from './layers'

// Map
export { createMap } from './map'

// Routing
export { calculateRoute, geocodeAddress } from './route'

// Route Rendering
export {
  RouteRenderer,
  initRouteRenderer,
  drawRoutes,
  setSelectedRoute,
  clearRoutes,
  getRouteRenderer,
} from './routeRenderer'

// Puck (User Location Marker)
export {
  Puck,
  initPuck,
  getPuck,
  updatePuckPosition,
  showPuck,
  hidePuck,
  disposePuck,
} from './puck'
