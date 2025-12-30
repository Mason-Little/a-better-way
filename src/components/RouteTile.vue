<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const startLocation = ref('')
const endLocation = ref('')

const handleSearch = () => {
  console.log('Searching route from', startLocation.value, 'to', endLocation.value)
}
</script>

<template>
  <div
    class="route-tile-card relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl shadow-blue-900/10 ring-1 ring-black/5 backdrop-blur-xl"
  >
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-bold text-gray-800">Plan your trip</h2>
      <div class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
        Best Route
      </div>
    </div>

    <div class="relative flex flex-col gap-4">
      <!-- Start Input -->
      <BaseInput v-model="startLocation" placeholder="Start location" label="From" />
      <!-- End Input -->
      <BaseInput v-model="endLocation" placeholder="Destination" label="To" />

      <!-- Actions -->
      <div class="mt-2 grid grid-cols-2 gap-3">
        <BaseButton variant="ghost" size="md"> Options </BaseButton>
        <BaseButton
          variant="primary"
          size="md"
          @click="handleSearch"
          :disabled="!startLocation || !endLocation"
        >
          Find Route
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
