<script setup lang="ts">
/**
 * UserPuck - Renderless component for user location tracking & navigation
 *
 * This component manages:
 * - User's location puck on the map
 * - Geolocation watching
 * - Map camera updates during navigation
 *
 * Fully self-contained - just mount with v-if to start navigation.
 *
 * @example
 * <UserPuck v-if="isNavigating" />
 */

import { onMounted, onUnmounted, ref } from 'vue'

import type { PuckPosition } from '@/entities'
import { useMapStore } from '@/stores/mapStore'
import { disposePuck, hidePuck, initPuck, showPuck, updatePuckPosition } from '@/lib/here-sdk/puck'

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

const {
  enableHighAccuracy = true,
  maximumAge = 0,
  timeout = 10000,
} = defineProps<{
  /** Enable high accuracy mode (GPS) */
  enableHighAccuracy?: boolean
  /** Maximum age of cached position in ms */
  maximumAge?: number
  /** Timeout for position request in ms */
  timeout?: number
}>()

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const { map, setMapView } = useMapStore()
const watchId = ref<number | null>(null)
const currentPosition = ref<PuckPosition | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Geolocation Handlers
// ─────────────────────────────────────────────────────────────────────────────

const handlePositionUpdate = (position: GeolocationPosition) => {
  const puckPosition: PuckPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    heading: position.coords.heading ?? undefined,
    accuracy: position.coords.accuracy,
  }

  currentPosition.value = puckPosition

  // Update puck on map
  updatePuckPosition(puckPosition)

  // Update map camera to follow user
  setMapView({
    center: { lat: puckPosition.lat, lng: puckPosition.lng },
    zoom: 19,
    tilt: 50,
    heading: puckPosition.heading,
    animate: true,
  })

  console.log('[UserPuck] Position updated:', puckPosition)
}

const handlePositionError = (error: GeolocationPositionError) => {
  console.error('[UserPuck] Geolocation error:', error.message)
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

onMounted(() => {
  if (!map.value) {
    console.warn('[UserPuck] Map not available, cannot initialize puck')
    return
  }

  // Initialize puck on the map
  initPuck(map.value)

  // Get initial position and show puck
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const initialPosition: PuckPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading ?? undefined,
        accuracy: position.coords.accuracy,
      }

      currentPosition.value = initialPosition
      showPuck(initialPosition)

      // Set map view to user puck position
      setMapView({
        center: {
          lat: initialPosition.lat,
          lng: initialPosition.lng,
        },
        zoom: 20,
        tilt: 45,
        heading: initialPosition.heading,
        animate: true,
      })

      console.log('[UserPuck] Puck initialized at:', initialPosition)
    },
    handlePositionError,
    { enableHighAccuracy, maximumAge, timeout },
  )

  // Start watching position for continuous updates
  watchId.value = navigator.geolocation.watchPosition(handlePositionUpdate, handlePositionError, {
    enableHighAccuracy,
    maximumAge,
    timeout,
  })

  console.log('[UserPuck] Started watching position, watchId:', watchId.value)
})

onUnmounted(() => {
  // Stop watching position
  if (watchId.value !== null) {
    navigator.geolocation.clearWatch(watchId.value)
    console.log('[UserPuck] Stopped watching position')
  }

  // Clean up puck from map
  hidePuck()
  disposePuck()

  console.log('[UserPuck] Disposed')
})
</script>

<template>
  <span />
</template>
