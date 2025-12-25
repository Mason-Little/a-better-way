<script setup lang="ts">
import { ref } from 'vue'
import MapContainer from '../components/MapContainer.vue'
import RoutingTile from '../components/RoutingTile.vue'
import type { Route } from '@tomtom-org/maps-sdk/core'

const mapRef = ref<InstanceType<typeof MapContainer> | null>(null)

const handleRoute = (route: Route) => {
  mapRef.value?.drawRoute(route)
}
</script>

<template>
  <main class="relative h-screen w-screen">
    <MapContainer ref="mapRef" />
    <div class="absolute top-4 left-4 z-10 w-full max-w-[400px]">
      <RoutingTile @route-calculated="handleRoute" />
    </div>
  </main>
</template>
