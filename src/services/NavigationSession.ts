/**
 * NavigationSession - Ties together location updates, puck marker, and camera
 */

import {
  startLocationTracking,
  type LocationUpdate,
  type LocationError,
  type LocationSubscription,
} from './LocationTracker'
import type { TomTomMap } from '@tomtom-org/maps-sdk/map'
import type { Map as MapLibreMap } from 'maplibre-gl'

export interface NavigationState {
  lat: number
  lng: number
  accuracyM: number
  speedKmh: number | null
  headingDeg: number | null
  timestamp: number
}

export interface NavigationSessionOptions {
  /** The TomTom map instance */
  map: TomTomMap
  /** Container element to append the puck to */
  container: HTMLElement
  /** Callback for state updates (for UI) */
  onStateUpdate?: (state: NavigationState) => void
  /** Callback for errors */
  onError?: (error: LocationError) => void
}

const CAMERA_THROTTLE_MS = 200
const CAMERA_DURATION_MS = 500
const CAMERA_PITCH = 65
const CAMERA_ZOOM = 17

// TomTom SDK exposes MapLibre as .mapLibreMap
type TomTomMapInternal = TomTomMap & { mapLibreMap: MapLibreMap }

export class NavigationSession {
  private glMap: MapLibreMap
  private container: HTMLElement
  private subscription: LocationSubscription | null = null
  private puckElement: HTMLDivElement | null = null
  private lastCameraUpdate = 0
  private lastPosition: { lat: number; lng: number } | null = null
  private lastBearing: number = 0
  private onStateUpdate?: (state: NavigationState) => void
  private onError?: (error: LocationError) => void

  constructor(options: NavigationSessionOptions) {
    this.glMap = (options.map as TomTomMapInternal).mapLibreMap
    this.container = options.container
    this.onStateUpdate = options.onStateUpdate
    this.onError = options.onError
  }

  start(): void {
    if (this.subscription) return

    this.subscription = startLocationTracking({
      onUpdate: (update) => this.handleLocationUpdate(update),
      onError: (error) => this.onError?.(error),
    })
  }

  stop(): void {
    this.subscription?.stop()
    this.subscription = null
    this.puckElement?.remove()
    this.puckElement = null
    this.lastPosition = null

    // Reset camera to flat view
    this.glMap.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 500,
      zoom: 15,
    })
  }

  private handleLocationUpdate(update: LocationUpdate): void {
    // Create puck if it doesn't exist
    if (!this.puckElement) {
      this.puckElement = this.createPuckElement()
      this.container.appendChild(this.puckElement)
    }

    // Position puck using map projection
    const point = this.glMap.project([update.lng, update.lat])
    this.puckElement.style.transform = `translate(${point.x - 14}px, ${point.y - 14}px)`

    // Compute bearing - use new bearing or keep last one
    const newBearing = this.computeBearing(update)
    if (newBearing !== null) {
      this.lastBearing = newBearing
    }

    // Arrow always points up since map rotates to match bearing
    const arrow = this.puckElement.querySelector('.puck-arrow') as HTMLElement
    if (arrow) {
      arrow.style.opacity = '1'
    }

    // Throttled camera follow - rotate map so direction of travel is "up"
    const now = Date.now()
    if (now - this.lastCameraUpdate > CAMERA_THROTTLE_MS) {
      this.lastCameraUpdate = now
      this.glMap.easeTo({
        center: [update.lng, update.lat],
        bearing: this.lastBearing,
        pitch: CAMERA_PITCH,
        zoom: CAMERA_ZOOM,
        duration: CAMERA_DURATION_MS,
      })
    }

    // Update state for UI
    this.onStateUpdate?.({
      lat: update.lat,
      lng: update.lng,
      accuracyM: update.accuracyM,
      speedKmh: update.speedMps !== null ? update.speedMps * 3.6 : null,
      headingDeg: this.lastBearing,
      timestamp: update.timestamp,
    })

    this.lastPosition = { lat: update.lat, lng: update.lng }
  }

  private computeBearing(update: LocationUpdate): number | null {
    if (update.headingDeg !== null) {
      return update.headingDeg
    }
    if (this.lastPosition) {
      const dLng = update.lng - this.lastPosition.lng
      const dLat = update.lat - this.lastPosition.lat
      if (Math.abs(dLng) > 0.00001 || Math.abs(dLat) > 0.00001) {
        const bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI
        return (bearing + 360) % 360
      }
    }
    return null
  }

  private createPuckElement(): HTMLDivElement {
    const el = document.createElement('div')
    el.className = 'nav-puck'
    el.style.cssText = 'position:absolute;top:0;left:0;z-index:100;pointer-events:none;'
    el.innerHTML = `
      <div class="puck-pulse"></div>
      <div class="puck-dot"></div>
      <div class="puck-arrow"></div>
    `
    return el
  }
}
