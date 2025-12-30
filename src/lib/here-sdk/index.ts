/**
 * HERE SDK
 * Clean wrapper for HERE Maps JavaScript API
 */

// Types
export type { MapOptions, MapInstance } from './map'
export type { DefaultLayerOptions } from './layers'

// Platform
export { getPlatform, resetPlatform } from './platform'

// Layers
export { createDefaultLayers, getVectorLayer } from './layers'

// Map
export { createMap } from './map'
