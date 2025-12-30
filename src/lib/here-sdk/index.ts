/**
 * HERE SDK
 * Clean wrapper for HERE Maps JavaScript API
 */

// Types
export type { MapOptions, MapInstance } from './map'
export type { DefaultLayerOptions } from './layers'
export type { RoutePoint, Route, RouteSection, RoutingOptions, RoutingResult } from './route'

// Platform
export { getPlatform, resetPlatform } from './platform'

// Layers
export { createDefaultLayers, getVectorLayer } from './layers'

// Map
export { createMap } from './map'

// Routing
export { calculateRoute, geocodeAddress } from './route'

