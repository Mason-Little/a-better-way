<script setup lang="ts">
import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import type { SearchResult } from '@/lib/here-sdk/search'
import BetterDropdown from '@/components/ui/BetterDropdown.vue'
import BetterInput from '@/components/ui/BetterInput.vue'

const model = defineModel<string>({ required: true })

const {
  label,
  placeholder = '',
  debounce = 300,
} = defineProps<{
  label?: string
  placeholder?: string
  debounce?: number
}>()

const emit = defineEmits<{
  select: [result: SearchResult]
  search: [query: string]
}>()

const suggestions = ref<SearchResult[]>([])

// Debounced search
const debouncedSearch = useDebounceFn((query: string) => {
  emit('search', query)
}, debounce)

function handleSearch(query: string) {
  if (query.length < 2) {
    suggestions.value = []
    return
  }
  debouncedSearch(query)
}

function handleSelect(suggestion: SearchResult) {
  model.value = suggestion.address
  suggestions.value = []
  emit('select', suggestion)
}

/**
 * Update suggestions from parent after search completes
 */
function setSuggestions(results: SearchResult[]) {
  suggestions.value = results
}

defineExpose({ setSuggestions })
</script>

<template>
  <div class="location-search-input">
    <BetterInput v-model="model" :placeholder="placeholder" :label="label" @search="handleSearch" />
    <BetterDropdown
      v-if="suggestions.length > 0"
      :suggestions="suggestions"
      @select="handleSelect"
    />
  </div>
</template>
