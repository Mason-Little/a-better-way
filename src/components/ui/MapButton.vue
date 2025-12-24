<script setup lang="ts">
defineProps<{
  label?: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}>()
</script>

<template>
  <button class="base-button" :class="[`variant-${variant || 'primary'}`]" :disabled="disabled">
    <slot>{{ label }}</slot>
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Primary Variant */
.variant-primary {
  background-color: #3b82f6;
  color: white;
}
.variant-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

/* Secondary Variant */
.variant-secondary {
  background-color: #e5e7eb;
  color: #374151;
}
.variant-secondary:hover:not(:disabled) {
  background-color: #d1d5db;
}

/* Danger Variant */
.variant-danger {
  background-color: #ef4444;
  color: white;
}
.variant-danger:hover:not(:disabled) {
  background-color: #dc2626;
}
</style>
