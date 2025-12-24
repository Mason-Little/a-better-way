<script setup lang="ts">
import { TomTomMap } from '@tomtom-org/maps-sdk/map'
import { onMounted, ref, shallowRef } from 'vue'

const mapContainer = ref<HTMLDivElement | null>(null)
const mapInstance = shallowRef<TomTomMap | null>(null)

onMounted(() => {
  if (!mapContainer.value) return

  mapInstance.value = new TomTomMap({
    container: mapContainer.value,
  })
})
</script>

<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
