<script setup lang="ts">
import { ref } from 'vue'
import MapButton from './ui/MapButton.vue'
import MapInput from './ui/MapInput.vue'

const startLocation = ref('')
const endLocation = ref('')

const handleRoute = () => {
  console.log('Routing from', startLocation.value, 'to', endLocation.value)
}
</script>

<template>
  <div class="routing-tile">
    <h2 class="tile-title">Get Directions</h2>
    <div class="tile-content">
      <MapInput
        v-model="startLocation"
        label="Start Location"
        placeholder="Enter start location"
        id="start-location"
      />

      <MapInput
        v-model="endLocation"
        label="Destination"
        placeholder="Enter destination"
        id="end-location"
      />

      <MapButton variant="primary" @click="handleRoute" class="route-button">
        Get Directions
      </MapButton>
    </div>
  </div>
</template>

<style scoped>
.routing-tile {
  background-color: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
}

.tile-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
  margin-top: 0;
}

.tile-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.route-button {
  margin-top: 0.5rem;
  width: 100%;
}
</style>
