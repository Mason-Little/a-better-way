<script setup lang="ts">
import { ref } from 'vue'
import MapContainer from '../components/MapContainer.vue'
import RoutingTile from '../components/RoutingTile.vue'
import RouteCarousel from '../components/RouteCarousel.vue'
import type { Route } from '@tomtom-org/maps-sdk/core'

const mapRef = ref<InstanceType<typeof MapContainer> | null>(null)
const routes = ref<Route[]>([])
const selectedRouteIndex = ref(0)

const handleRoutesCalculated = (calculatedRoutes: Route[]) => {
  routes.value = calculatedRoutes
  selectedRouteIndex.value = 0
  // Draw the first route
  if (calculatedRoutes.length > 0) {
    mapRef.value?.drawRoute(calculatedRoutes[0]!)
  }
}

const handleRouteSelect = (index: number) => {
  selectedRouteIndex.value = index
  const selectedRoute = routes.value[index]
  if (selectedRoute) {
    mapRef.value?.drawRoute(selectedRoute)
  }
}
</script>

<template>
  <main class="relative h-screen w-screen">
    <MapContainer ref="mapRef" />
    <div class="absolute top-4 left-4 z-10 flex w-full max-w-[400px] flex-col gap-4">
      <RoutingTile @routes-calculated="handleRoutesCalculated" />
      <RouteCarousel
        v-if="routes.length > 0"
        :routes="routes"
        :selected-index="selectedRouteIndex"
        @select="handleRouteSelect"
      />
    </div>
  </main>
</template>
