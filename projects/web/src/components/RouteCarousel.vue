<script setup lang="ts">
import { useRoutesStore } from '@/stores/routesStore'
import RouteCard from '@/components/RouteCard.vue'
import BetterCarousel from '@/components/ui/BetterCarousel.vue'

const store = useRoutesStore()
</script>

<template>
  <div v-if="store.routes.length > 0" class="route-carousel w-full">
    <div class="mb-3 flex items-center justify-between px-1">
      <h3 class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
        Available Routes
      </h3>
      <span
        class="rounded-full bg-white/50 px-2 py-0.5 text-[10px] font-medium text-blue-600 ring-1 ring-black/5"
      >
        {{ store.routes.length }} found
      </span>
    </div>

    <BetterCarousel :item-count="store.routes.length" @change="store.select">
      <RouteCard
        v-for="(route, index) in store.routes"
        :key="route.id"
        :route="route"
        :index="index"
        :selected="index === store.selectedIndex"
        @select="store.select(index)"
      />
    </BetterCarousel>
  </div>
</template>
