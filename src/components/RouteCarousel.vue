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
    <div class="mb-2 flex items-center justify-between px-2">
      <h3 class="text-sm font-semibold text-gray-700">Available Routes</h3>
      <span class="text-xs text-gray-500">{{ routes.length }} routes found</span>
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
