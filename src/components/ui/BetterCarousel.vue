<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const { itemCount } = defineProps<{
  itemCount: number
}>()

const emit = defineEmits<{
  change: [index: number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const currentIndex = ref(0)

const canScrollLeft = computed(() => currentIndex.value > 0)
const canScrollRight = computed(() => currentIndex.value < itemCount - 1)

function scrollTo(index: number) {
  if (index < 0 || index >= itemCount) return
  currentIndex.value = index
  emit('change', index)

  const container = containerRef.value
  if (!container) return

  const items = container.children
  if (items[index]) {
    items[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
}

function scrollLeft() {
  scrollTo(currentIndex.value - 1)
}

function scrollRight() {
  scrollTo(currentIndex.value + 1)
}

// Handle scroll events to update current index
function handleScroll() {
  const container = containerRef.value
  if (!container) return

  const scrollLeft = container.scrollLeft
  const itemWidth = container.scrollWidth / itemCount
  const newIndex = Math.round(scrollLeft / itemWidth)

  if (newIndex !== currentIndex.value && newIndex >= 0 && newIndex < itemCount) {
    currentIndex.value = newIndex
    emit('change', newIndex)
  }
}

// Expose scrollTo for parent components
defineExpose({ scrollTo })

watch(
  () => itemCount,
  () => {
    if (currentIndex.value >= itemCount) {
      currentIndex.value = Math.max(0, itemCount - 1)
    }
  },
)
</script>

<template>
  <div class="carousel-wrapper relative w-full">
    <!-- Navigation Arrows -->
    <button
      v-if="canScrollLeft"
      @click="scrollLeft"
      class="carousel-arrow carousel-arrow-left absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-black/5 transition-all hover:bg-white hover:shadow-xl"
      aria-label="Previous"
    >
      <svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <button
      v-if="canScrollRight"
      @click="scrollRight"
      class="carousel-arrow carousel-arrow-right absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-black/5 transition-all hover:bg-white hover:shadow-xl"
      aria-label="Next"
    >
      <svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Scroll Container -->
    <div
      ref="containerRef"
      class="carousel-container flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-8 py-2"
      @scroll="handleScroll"
    >
      <slot />
    </div>

    <!-- Dot Indicators -->
    <div v-if="itemCount > 1" class="carousel-dots mt-3 flex justify-center gap-1.5">
      <button
        v-for="i in itemCount"
        :key="i - 1"
        @click="scrollTo(i - 1)"
        class="h-2 w-2 rounded-full transition-all"
        :class="currentIndex === i - 1 ? 'bg-blue-600 scale-110' : 'bg-gray-300 hover:bg-gray-400'"
        :aria-label="`Go to item ${i}`"
      />
    </div>
  </div>
</template>

<style scoped>
.carousel-container::-webkit-scrollbar {
  display: none;
}

.carousel-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
