<script setup lang="ts">
import { ref, watch } from 'vue'

const { open = false } = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(open)

watch(
  () => open,
  (newVal) => {
    isVisible.value = newVal
  },
)

const handleClose = () => {
  emit('close')
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isVisible" class="fixed inset-0 z-40 bg-black/40" @click="handleBackdropClick" />
    </Transition>

    <!-- Sidebar panel -->
    <Transition name="slide">
      <div
        v-if="isVisible"
        class="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-[360px] flex-col bg-white shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 class="text-lg font-semibold text-gray-900">Directions</h2>
          <button
            @click="handleClose"
            class="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Sidebar slide */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
