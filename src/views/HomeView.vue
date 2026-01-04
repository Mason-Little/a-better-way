<script setup lang="ts">
import { ref } from 'vue'

import MapContainer from '@/components/MapContainer.vue'
import RouteTile from '@/components/RouteTile.vue'
import UserPuck from '@/components/UserPuck.vue'

const isNavigating = ref(false)

const handleGo = () => {
  isNavigating.value = true
  console.log('[HomeView] Navigation started')
}
</script>

<template>
  <div class="home-view">
    <MapContainer />

    <!-- User location puck (renderless, only active when navigating) -->
    <UserPuck v-if="isNavigating" />

    <div class="overlay-container">
      <RouteTile @go="handleGo" />
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
