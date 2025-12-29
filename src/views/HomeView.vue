<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import MapContainer from '../components/MapContainer.vue'
import RoutingTile from '../components/RoutingTile.vue'
import RouteCarousel from '../components/RouteCarousel.vue'
import MobileSidebar from '../components/MobileSidebar.vue'
import HamburgerButton from '../components/ui/HamburgerButton.vue'
import NavigationPanel from '../components/NavigationPanel.vue'
import type { Route } from '@tomtom-org/maps-sdk/core'
import { NavigationSession, type NavigationState } from '@/services/NavigationSession'
import type { LocationError } from '@/services/LocationTracker'

const mapRef = ref<InstanceType<typeof MapContainer> | null>(null)
const routes = ref<Route[]>([])
const selectedRouteIndex = ref(0)
const sidebarOpen = ref(false)
const navContainer = ref<HTMLElement | null>(null)

// Navigation state
const isNavigating = ref(false)
const navSession = ref<NavigationSession | null>(null)
const navState = ref<NavigationState | null>(null)
const navError = ref<LocationError | null>(null)

const handleRoutesCalculated = (calculatedRoutes: Route[]) => {
  routes.value = calculatedRoutes
  selectedRouteIndex.value = 0
  if (calculatedRoutes.length > 0) {
    mapRef.value?.drawRoute(calculatedRoutes[0]!)
  }
  sidebarOpen.value = false
}

const handleRouteSelect = (index: number) => {
  selectedRouteIndex.value = index
  const selectedRoute = routes.value[index]
  if (selectedRoute) {
    mapRef.value?.drawRoute(selectedRoute)
  }
}

const startNavigation = () => {
  const map = mapRef.value?.getMap()
  if (!map) {
    console.error('[HomeView] Map not ready')
    return
  }

  navError.value = null
  navSession.value = new NavigationSession({
    map,
    container: navContainer.value!,
    onStateUpdate: (state) => {
      navState.value = state
    },
    onError: (error) => {
      navError.value = error
    },
  })
  navSession.value.start()
  isNavigating.value = true
}

const stopNavigation = () => {
  navSession.value?.stop()
  navSession.value = null
  navState.value = null
  isNavigating.value = false
}

onUnmounted(() => {
  navSession.value?.stop()
})
</script>

<template>
  <main ref="navContainer" class="relative h-screen w-screen">
    <MapContainer ref="mapRef" />

    <!-- Mobile: Top buttons -->
    <div class="safe-top absolute left-3 top-3 z-10 flex gap-2 sm:hidden">
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

    <!-- Navigation controls -->
    <NavigationPanel
      v-if="routes.length > 0"
      :is-navigating="isNavigating"
      :state="navState"
      :error="navError"
      @start="startNavigation"
      @stop="stopNavigation"
    />
  </main>
</template>
