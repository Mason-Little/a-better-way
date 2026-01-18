import { getPlatform } from './platform'

export interface DefaultLayerOptions {
  language?: string
  pois?: boolean
}

/** Create default map layers with HARP 3D vector rendering engine */
export function createDefaultLayers(options: DefaultLayerOptions = {}) {
  const platform = getPlatform()
  return platform.createDefaultLayers({
    engineType: H.Map.EngineType.HARP,
    lg: options.language ?? 'en',
    pois: options.pois ?? false,
  })
}
