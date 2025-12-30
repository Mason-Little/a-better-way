<script setup lang="ts">
import MapContainer from '@/components/MapContainer.vue'
import RouteTile from '@/components/RouteTile.vue'
</script>

<template>
  <div class="home-view">
    <MapContainer />
    <div class="overlay-container">
      <RouteTile />
    </div>
  </div>
</template>

<style scoped>
.home-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.overlay-container {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 10;
  width: 100%;
  max-width: 400px;
  pointer-events: none; /* Let clicks pass through empty areas */
}

/* Re-enable pointer events for the tile itself */
.overlay-container > * {
  pointer-events: auto;
}
</style>
