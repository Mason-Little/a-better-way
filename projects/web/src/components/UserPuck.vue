<script setup lang="ts">
/**
 * UserPuck - Component for user location tracking & navigation
 */

import { onMounted, onUnmounted, ref } from 'vue'

import type { PuckPosition } from '@/entities'
import { useMapStore } from '@/stores/mapStore'
import { disposePuck, hidePuck, initPuck, showPuck, updatePuckPosition } from '@/lib/here-sdk/puck'

const {
  enableHighAccuracy = true,
  maximumAge = 0,
  timeout = 10000,
} = defineProps<{
  enableHighAccuracy?: boolean
  maximumAge?: number
  timeout?: number
}>()

const mapStore = useMapStore()
const watchId = ref<number | null>(null)
const position = ref<PuckPosition | null>(null)

function onPosition(geo: GeolocationPosition) {
  const pos: PuckPosition = {
    lat: geo.coords.latitude,
    lng: geo.coords.longitude,
    heading: geo.coords.heading ?? undefined,
    accuracy: geo.coords.accuracy,
  }

  position.value = pos
  updatePuckPosition(pos)

  mapStore.setView({
    center: { lat: pos.lat, lng: pos.lng },
    zoom: 19,
    tilt: 50,
    heading: pos.heading,
    animate: true,
  })
}

function onError(err: GeolocationPositionError) {
  console.error('[UserPuck] Geolocation error:', err.message)
}

onMounted(() => {
  if (!mapStore.map) {
    console.warn('[UserPuck] Map not available')
    return
  }

  initPuck(mapStore.map)

  navigator.geolocation.getCurrentPosition(
    (geo) => {
      const pos: PuckPosition = {
        lat: geo.coords.latitude,
        lng: geo.coords.longitude,
        heading: geo.coords.heading ?? undefined,
        accuracy: geo.coords.accuracy,
      }
      position.value = pos
      showPuck(pos)
      mapStore.setView({
        center: { lat: pos.lat, lng: pos.lng },
        zoom: 20,
        tilt: 45,
        heading: pos.heading,
        animate: true,
      })
    },
    onError,
    { enableHighAccuracy, maximumAge, timeout },
  )

  watchId.value = navigator.geolocation.watchPosition(onPosition, onError, {
    enableHighAccuracy,
    maximumAge,
    timeout,
  })
})

onUnmounted(() => {
  if (watchId.value !== null) {
    navigator.geolocation.clearWatch(watchId.value)
  }
  hidePuck()
  disposePuck()
})
</script>

<template>
  <span />
</template>
