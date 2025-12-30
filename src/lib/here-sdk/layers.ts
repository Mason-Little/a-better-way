/**
 * HERE Maps Layer Utilities
 * Functions for creating and managing map layers
 */

import { getPlatform } from './platform'

export interface DefaultLayerOptions {
  /** Language for map labels (default: 'en') */
  language?: string
  /** Enable POI display */
  pois?: boolean
}

/**
 * Create default layers with HARP engine for modern 3D vector rendering
 */
export function createDefaultLayers(options: DefaultLayerOptions = {}) {
  const platform = getPlatform()

  return platform.createDefaultLayers({
    engineType: H.Map.EngineType.HARP,
    lg: options.language ?? 'en',
    pois: options.pois ?? false,
  })
}

/**
 * Get the vector normal map layer (primary base layer)
 */
export function getVectorLayer(options: DefaultLayerOptions = {}) {
  const layers = createDefaultLayers(options)
  return layers.vector.normal.map
}
