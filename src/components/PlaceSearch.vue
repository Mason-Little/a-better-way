<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { searchPlaces, type SearchResult } from '@/lib/here/search'

const { modelValue, label, placeholder, id } = defineProps<{
  modelValue: SearchResult | null
  label?: string
  placeholder?: string
  id?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SearchResult | null]
}>()

const inputValue = ref(modelValue?.title ?? '')
const suggestions = ref<SearchResult[]>([])
const isOpen = ref(false)
const isLoading = ref(false)

// Sync input with modelValue changes from parent
watch(
  () => modelValue,
  (newVal) => {
    if (newVal) {
      inputValue.value = newVal.title
    }
  },
)

const search = useDebounceFn(async (query: string) => {
  if (query.length < 2) {
    suggestions.value = []
    isOpen.value = false
    return
  }

  isLoading.value = true
  try {
    suggestions.value = await searchPlaces(query)
    isOpen.value = suggestions.value.length > 0
  } finally {
    isLoading.value = false
  }
}, 300)

const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  inputValue.value = value
  emit('update:modelValue', null) // Clear selection when typing
  search(value)
}

const selectSuggestion = (result: SearchResult) => {
  inputValue.value = result.title
  emit('update:modelValue', result)
  suggestions.value = []
  isOpen.value = false
}

const handleBlur = () => {
  // Delay to allow click on suggestion
  setTimeout(() => {
    isOpen.value = false
  }, 150)
}
</script>

<template>
  <div class="relative">
    <label v-if="label" :for="id" class="mb-1 block text-xs text-gray-500">
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="id"
        type="text"
        :value="inputValue"
        :placeholder="placeholder"
        autocomplete="off"
        class="w-full rounded-lg border border-gray-200 px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none"
        @input="handleInput"
        @focus="isOpen = suggestions.length > 0"
        @blur="handleBlur"
      />
      <div v-if="isLoading" class="absolute right-2 top-1/2 -translate-y-1/2">
        <svg class="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
            fill="none"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
      <div v-else-if="modelValue" class="absolute right-2 top-1/2 -translate-y-1/2 text-green-500">
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <!-- Suggestions dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen && suggestions.length > 0"
        class="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg"
      >
        <ul class="max-h-48 overflow-y-auto py-1">
          <li
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="cursor-pointer px-3 py-2 hover:bg-blue-50"
            @mousedown.prevent="selectSuggestion(suggestion)"
          >
            <div class="text-sm font-medium text-gray-900">{{ suggestion.title }}</div>
            <div class="truncate text-xs text-gray-500">{{ suggestion.address }}</div>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
