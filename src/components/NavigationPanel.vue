<script setup lang="ts">
import { ref, computed } from 'vue'
import PlaceSearch from './PlaceSearch.vue'
import type { SearchResult } from '@/lib/here/search'

const { isLoading = false } = defineProps<{
  isLoading?: boolean
}>()

const emit = defineEmits<{
  route: [origin: { lat: number; lng: number }, destination: { lat: number; lng: number }]
  clear: []
}>()

const origin = ref<SearchResult | null>(null)
const destination = ref<SearchResult | null>(null)

const canRoute = computed(() => origin.value && destination.value)

const handleRoute = () => {
  if (!origin.value || !destination.value) return
  emit('route', origin.value.position, destination.value.position)
}

const handleClear = () => {
  emit('clear')
}
</script>

<template>
  <div class="absolute bottom-8 left-4 right-4 z-10 sm:left-auto sm:right-4 sm:w-80">
    <div class="rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur">
      <h3 class="mb-3 text-sm font-semibold text-gray-700">Route Planner</h3>

      <!-- Origin Search -->
      <div class="mb-3">
        <PlaceSearch
          id="origin"
          v-model="origin"
          label="Origin"
          placeholder="e.g. Walmart, Squamish"
        />
      </div>

      <!-- Destination Search -->
      <div class="mb-4">
        <PlaceSearch
          id="destination"
          v-model="destination"
          label="Destination"
          placeholder="e.g. Vancouver Airport"
        />
      </div>

      <!-- Buttons -->
      <div class="flex gap-2">
        <button
          class="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isLoading || !canRoute"
          @click="handleRoute"
        >
          {{ isLoading ? 'Loading...' : 'Route' }}
        </button>
        <button
          class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          @click="handleClear"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>
