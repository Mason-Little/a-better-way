<script setup lang="ts">
import type { Route } from '@tomtom-org/maps-sdk/core'
import { ref, watch, nextTick } from 'vue'
import IconButton from '@/components/ui/IconButton.vue'
import RouteCard from '@/components/ui/RouteCard.vue'

const { routes, selectedIndex = 0 } = defineProps<{
  routes: Route[]
  selectedIndex?: number
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const scrollContainer = ref<HTMLDivElement | null>(null)

const scrollToPrev = () => {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: -160, behavior: 'smooth' })
}

const scrollToNext = () => {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: 160, behavior: 'smooth' })
}

const handleSelect = (index: number) => {
  emit('select', index)
}

// Auto-scroll to selected route when it changes
watch(
  () => selectedIndex,
  async () => {
    await nextTick()
    if (!scrollContainer.value) return
    const cards = scrollContainer.value.children
    if (cards[selectedIndex]) {
      ;(cards[selectedIndex] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  },
)
</script>

<template>
  <div class="w-full rounded-xl bg-white p-4 shadow-lg">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-700">
        {{ routes.length }} Route{{ routes.length !== 1 ? 's' : '' }} Found
      </h3>
      <div class="flex gap-2">
        <IconButton @click="scrollToPrev" :disabled="routes.length <= 2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </IconButton>
        <IconButton @click="scrollToNext" :disabled="routes.length <= 2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </IconButton>
      </div>
    </div>

    <!-- Carousel -->
    <div
      ref="scrollContainer"
      class="flex gap-3 overflow-x-auto scroll-smooth pb-2"
      style="scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent"
    >
      <RouteCard
        v-for="(route, index) in routes"
        :key="index"
        :route="route"
        :index="index"
        :active="index === selectedIndex"
        @select="handleSelect(index)"
      />
    </div>

    <!-- Empty state -->
    <div v-if="routes.length === 0" class="py-8 text-center text-gray-400">
      No routes to display
    </div>
  </div>
</template>
