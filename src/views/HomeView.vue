<script setup lang="ts">
import MapContainer from '../components/MapContainer.vue'
import RoutingTile from '../components/RoutingTile.vue'
</script>

<template>
  <main class="home-view">
    <MapContainer />
    <div class="routing-overlay">
      <RoutingTile />
    </div>
  </main>
</template>

<style scoped>
.home-view {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.routing-overlay {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
  width: 100%;
  max-width: 400px;
}
</style>
