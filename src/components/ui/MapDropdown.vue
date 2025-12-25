<script setup lang="ts">
import type { SearchOption } from '@/types/search'

const { options } = defineProps<{
  options: SearchOption[]
}>()

const emit = defineEmits<{
  select: [option: SearchOption]
}>()

const handleSelect = (option: SearchOption) => {
  emit('select', option)
}

const getSecondaryText = (option: SearchOption) => {
  const parts = [
    option.address.municipality,
    option.address.countrySubdivision,
    option.address.country,
  ].filter(Boolean)

  return parts.join(', ')
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-100 ease-out"
    enter-from-class="transform scale-95 opacity-0"
    enter-to-class="transform scale-100 opacity-100"
    leave-active-class="transition duration-75 ease-in"
    leave-from-class="transform scale-100 opacity-100"
    leave-to-class="transform scale-95 opacity-0"
  >
    <div
      v-if="options.length > 0"
      class="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white/80 shadow-2xl backdrop-blur-xl"
    >
      <ul class="max-h-[300px] overflow-y-auto py-2">
        <li
          v-for="option in options"
          :key="option.id"
          class="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-blue-50/50"
          @click="handleSelect(option)"
        >
          <!-- Icon Container -->
          <div
            class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="size-4"
            >
              <path
                fill-rule="evenodd"
                d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          <!-- Text Content -->
          <div class="flex flex-col overflow-hidden">
            <span class="truncate text-sm font-medium text-gray-900 group-hover:text-blue-700">
              {{ option.label.split(',')[0] }}
            </span>
            <span class="truncate text-xs text-gray-500 group-hover:text-blue-500/80">
              {{ getSecondaryText(option) || option.label }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </Transition>
</template>
