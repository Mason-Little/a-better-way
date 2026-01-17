<script setup lang="ts">
import { useRoutesStore } from '@/stores/routesStore'
import RouteCard from '@/components/RouteCard.vue'
import BetterCarousel from '@/components/ui/BetterCarousel.vue'

const { routes, selectedRouteIndex, selectRoute } = useRoutesStore()

function handleRouteSelect(index: number) {
  selectRoute(index)
}

function handleCarouselChange(index: number) {
  selectRoute(index)
}
</script>

<template>
  <div v-if="routes.length > 0" class="route-carousel w-full">
    <div class="mb-3 flex items-center justify-between px-1">
      <h3 class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
        Available Routes
      </h3>
      <span
        class="rounded-full bg-white/50 px-2 py-0.5 text-[10px] font-medium text-blue-600 ring-1 ring-black/5"
      >
        {{ routes.length }} found
      </span>
    </div>

    <BetterCarousel :item-count="routes.length" @change="handleCarouselChange">
      <RouteCard
        v-for="(route, index) in routes"
        :key="route.id"
        :route="route"
        :index="index"
        :selected="index === selectedRouteIndex"
        @select="handleRouteSelect(index)"
      />
    </BetterCarousel>
  </div>
</template>
