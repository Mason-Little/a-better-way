<script setup lang="ts">
import { ref } from 'vue'
import MapContainer from '../components/MapContainer.vue'
import RoutingTile from '../components/RoutingTile.vue'
import RouteCarousel from '../components/RouteCarousel.vue'
import MobileSidebar from '../components/MobileSidebar.vue'
import HamburgerButton from '../components/ui/HamburgerButton.vue'
import type { Route } from '@tomtom-org/maps-sdk/core'

const mapRef = ref<InstanceType<typeof MapContainer> | null>(null)
const routes = ref<Route[]>([])
const selectedRouteIndex = ref(0)
const sidebarOpen = ref(false)

const handleRoutesCalculated = (calculatedRoutes: Route[]) => {
  routes.value = calculatedRoutes
  selectedRouteIndex.value = 0
  // Draw the first route
  if (calculatedRoutes.length > 0) {
    mapRef.value?.drawRoute(calculatedRoutes[0]!)
  }
  // Close sidebar after getting routes on mobile
  sidebarOpen.value = false
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

    <!-- Mobile: Hamburger button -->
    <div class="safe-top absolute left-3 top-3 z-10 sm:hidden">
      <HamburgerButton @click="sidebarOpen = true" />
    </div>

    <!-- Mobile: Slide-out sidebar -->
    <MobileSidebar :open="sidebarOpen" @close="sidebarOpen = false">
      <div class="flex flex-col gap-4">
        <RoutingTile @routes-calculated="handleRoutesCalculated" />
        <RouteCarousel
          v-if="routes.length > 0"
          :routes="routes"
          :selected-index="selectedRouteIndex"
          @select="handleRouteSelect"
        />
      </div>
    </MobileSidebar>

    <!-- Desktop: Fixed panel -->
    <div class="absolute left-4 top-4 z-10 hidden w-full max-w-[400px] flex-col gap-4 sm:flex">
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
