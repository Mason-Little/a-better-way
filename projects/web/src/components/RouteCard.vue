<script setup lang="ts">
import { computed } from 'vue'

import type { Route } from '@/entities'

const { route, index, selected = false } = defineProps<{
  route: Route
  index: number
  selected?: boolean
}>()

const emit = defineEmits<{ select: [] }>()

const summary = computed(() => route.sections[0]?.summary)
const isOptimized = computed(() => (route.iteration ?? 0) > 0)

const duration = computed(() => {
  const base = summary.value?.baseDuration ?? summary.value?.duration ?? 0
  const penalty = route.score?.total ?? 0
  const mins = Math.round((base + penalty) / 60)

  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return `${mins} min`
})

const distance = computed(() => {
  const m = summary.value?.length ?? 0
  return `${(m / 1000).toFixed(1)} km`
})

const delay = computed(() => Math.round((route.score?.total ?? 0) / 60))
const trafficCount = computed(() => route.score?.trafficSegmentCount ?? 0)
const stopSignCount = computed(() => route.score?.stopSignCount ?? 0)
</script>

<template>
  <button
    @click="emit('select')"
    class="group relative flex min-w-[180px] flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 sm:min-w-[200px]"
    :class="[
      selected
        ? 'border-blue-500/50 bg-blue-50/80 shadow-lg ring-1 ring-blue-500/20 backdrop-blur-xl'
        : 'border-white/40 bg-white/40 shadow-sm hover:bg-white/60 backdrop-blur-lg',
    ]"
  >
    <div class="mb-3 flex w-full items-start justify-between">
      <div class="flex flex-col gap-1">
        <span
          class="text-[10px] font-bold tracking-wider uppercase"
          :class="selected ? 'text-blue-600' : 'text-gray-500'"
        >
          Route {{ index + 1 }}
        </span>
        <span v-if="isOptimized" class="text-[10px] font-bold text-indigo-600">
          Iter {{ route.iteration }}
        </span>
      </div>

      <div
        v-if="delay > 0"
        class="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5"
      >
        <span class="h-1 w-1 rounded-full bg-orange-500" />
        <span class="text-[10px] font-bold text-orange-600">+{{ delay }}m</span>
      </div>
    </div>

    <!-- Traffic & Stop Sign Badges -->
    <div v-if="trafficCount > 0 || stopSignCount > 0" class="mb-2 flex flex-wrap gap-1.5">
      <div
        v-if="trafficCount > 0"
        class="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5"
        :title="`${trafficCount} traffic segments`"
      >
        <span class="text-[10px]">🚦</span>
        <span class="text-[10px] font-bold text-red-600">{{ trafficCount }}</span>
      </div>
      <div
        v-if="stopSignCount > 0"
        class="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5"
        :title="`${stopSignCount} stop signs`"
      >
        <span class="text-[10px]">🛑</span>
        <span class="text-[10px] font-bold text-amber-600">{{ stopSignCount }}</span>
      </div>
    </div>

    <div class="space-y-0.5">
      <div
        class="text-2xl font-black tracking-tight"
        :class="selected ? 'text-gray-900' : 'text-gray-700'"
      >
        {{ duration }}
      </div>
      <div class="text-xs font-medium text-gray-500">{{ distance }}</div>
    </div>
  </button>
</template>
