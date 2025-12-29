<script setup lang="ts">
import { TomTomMap, RoutingModule } from '@tomtom-org/maps-sdk/map'
import type { Route } from '@tomtom-org/maps-sdk/core'
import { onMounted, ref, shallowRef } from 'vue'

const mapContainer = ref<HTMLDivElement | null>(null)
const mapInstance = shallowRef<TomTomMap | null>(null)
const routingModule = shallowRef<RoutingModule | null>(null)

const drawRoute = (route: Route) => {
  if (!routingModule.value) return
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

const getMap = () => mapInstance.value

defineExpose({
  drawRoute,
  getMap,
})
</script>

<template>
  <div ref="mapContainer" class="h-full w-full"></div>
</template>

<style>
/* Navigation puck styles */
.nav-puck {
  position: relative;
  width: 28px;
  height: 28px;
}

.puck-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  background: #4285f4;
  border: 3px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.puck-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  background: rgba(66, 133, 244, 0.25);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: puck-pulse 2s ease-out infinite;
  z-index: 1;
}

.puck-arrow {
  position: absolute;
  top: -10px;
  left: 50%;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 14px solid #4285f4;
  transform: translateX(-50%);
  transform-origin: center 24px;
  opacity: 0;
  z-index: 3;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

@keyframes puck-pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}
</style>
