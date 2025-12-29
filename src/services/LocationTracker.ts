/**
 * LocationTracker - Simple watchPosition wrapper
 * Requires HTTPS for geolocation (works on localhost)
 */

export interface LocationUpdate {
  lat: number
  lng: number
  accuracyM: number
  headingDeg: number | null
  speedMps: number | null
  timestamp: number
}

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED'
  message: string
}

export interface LocationTrackerOptions {
  onUpdate: (update: LocationUpdate) => void
  onError: (error: LocationError) => void
}

export interface LocationSubscription {
  stop: () => void
}

function assertGeolocationUsable(): LocationError | null {
  if (!navigator.geolocation) {
    return { code: 'NOT_SUPPORTED', message: 'Geolocation not supported' }
  }
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn('[LocationTracker] Geolocation requires HTTPS (except localhost)')
  }
  return null
}

function mapGeolocationError(err: GeolocationPositionError): LocationError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return { code: 'PERMISSION_DENIED', message: 'Location permission denied' }
    case err.POSITION_UNAVAILABLE:
      return { code: 'POSITION_UNAVAILABLE', message: 'Location unavailable' }
    case err.TIMEOUT:
      return { code: 'TIMEOUT', message: 'Location request timed out' }
    default:
      return { code: 'POSITION_UNAVAILABLE', message: 'Unknown geolocation error' }
  }
}

export function startLocationTracking(options: LocationTrackerOptions): LocationSubscription | null {
  const usabilityError = assertGeolocationUsable()
  if (usabilityError) {
    options.onError(usabilityError)
    return null
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      options.onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracyM: position.coords.accuracy,
        headingDeg: position.coords.heading,
        speedMps: position.coords.speed,
        timestamp: position.timestamp,
      })
    },
    (err) => {
      options.onError(mapGeolocationError(err))
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    },
  )

  return {
    stop: () => navigator.geolocation.clearWatch(watchId),
  }
}
