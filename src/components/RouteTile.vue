<script setup lang="ts">
import { ref } from 'vue'
import BetterInput from '@/components/ui/BetterInput.vue'
import BetterButton from '@/components/ui/BetterButton.vue'
import { searchPlaces, type SearchResult } from '@/lib/here-sdk/search'
import BetterDropdown from '@/components/ui/BetterDropdown.vue'
import { getRoutes } from '@/utils/route'

const startLocation = ref('')
const endLocation = ref('')
const startSuggestions = ref<SearchResult[]>([])
const endSuggestions = ref<SearchResult[]>([])

const handleSearch = () => {
  getRoutes(startLocation.value, endLocation.value)
}

const handleStartSelect = (suggestion: SearchResult) => {
  startLocation.value = suggestion.address
  startSuggestions.value = []
}

const handleEndSelect = (suggestion: SearchResult) => {
  endLocation.value = suggestion.address
  endSuggestions.value = []
}

// Only called on actual user input (not programmatic changes)
const handleStartSearch = async (query: string) => {
  if (query.length < 2) {
    startSuggestions.value = []
    return
  }
  try {
    startSuggestions.value = await searchPlaces(query)
    console.log('Start suggestions:', startSuggestions.value)
  } catch (error) {
    console.error('Search failed:', error)
  }
}

const handleEndSearch = async (query: string) => {
  if (query.length < 2) {
    endSuggestions.value = []
    return
  }
  try {
    endSuggestions.value = await searchPlaces(query)
    console.log('End suggestions:', endSuggestions.value)
  } catch (error) {
    console.error('Search failed:', error)
  }
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
      <BetterInput
        v-model="startLocation"
        placeholder="Start location"
        label="From"
        @search="handleStartSearch"
      />
      <BetterDropdown
        v-if="startSuggestions.length > 0"
        :suggestions="startSuggestions"
        @select="handleStartSelect"
      />
      <!-- End Input -->
      <BetterInput
        v-model="endLocation"
        placeholder="Destination"
        label="To"
        @search="handleEndSearch"
      />
      <BetterDropdown
        v-if="endSuggestions.length > 0"
        :suggestions="endSuggestions"
        @select="handleEndSelect"
      />

      <!-- Actions -->
      <div class="mt-2 grid grid-cols-2 gap-3">
        <BetterButton variant="ghost" size="md"> Options </BetterButton>
        <BetterButton
          variant="primary"
          size="md"
          @click="handleSearch"
          :disabled="!startLocation || !endLocation"
        >
          Find Route
        </BetterButton>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
