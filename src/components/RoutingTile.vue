<script setup lang="ts">
import { ref } from 'vue'
import MapButton from '@/components/ui/MapButton.vue'
import MapInput from '@/components/ui/MapInput.vue'

const startLocation = ref('')
const endLocation = ref('')

const handleRoute = () => {
  console.log('Routing from', startLocation.value, 'to', endLocation.value)
}
</script>

<template>
  <div class="w-full max-w-[400px] rounded-xl bg-white p-6 shadow-lg">
    <h2 class="mt-0 mb-6 text-xl font-semibold text-gray-900">Get Directions</h2>
    <div class="flex flex-col gap-4">
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

      <MapButton variant="primary" @click="handleRoute" class="mt-2 w-full">
        Get Directions
      </MapButton>
    </div>
  </div>
</template>
