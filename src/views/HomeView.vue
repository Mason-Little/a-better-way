<script setup lang="ts">
import MapContainer from '../components/MapContainer.vue'
import RoutingTile from '../components/RoutingTile.vue'
</script>

<template>
  <main class="relative h-screen w-screen">
    <MapContainer />
    <div class="absolute top-4 left-4 z-10 w-full max-w-[400px]">
      <RoutingTile />
    </div>
  </main>
</template>
