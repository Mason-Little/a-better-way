<script setup lang="ts">
import { TomTomMap, RoutingModule } from '@tomtom-org/maps-sdk/map'
import type { Route } from '@tomtom-org/maps-sdk/core'
import { onMounted, ref, shallowRef } from 'vue'

const mapContainer = ref<HTMLDivElement | null>(null)
const mapInstance = shallowRef<TomTomMap | null>(null)
const routingModule = shallowRef<RoutingModule | null>(null)

const drawRoute = (route: Route) => {
  if (!routingModule.value) return
  // Clear existing routes and draw the new one
  routingModule.value.clearRoutes()
  routingModule.value.showRoutes(route)
}

onMounted(async () => {
  if (!mapContainer.value) return

  mapInstance.value = new TomTomMap({
    container: mapContainer.value,
  })

  routingModule.value = await RoutingModule.get(mapInstance.value)
})

defineExpose({
  drawRoute,
})
</script>

<template>
  <div ref="mapContainer" class="h-full w-full"></div>
</template>
