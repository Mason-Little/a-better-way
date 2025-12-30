<script setup lang="ts">
import type { SearchResult } from '@/lib/here-sdk/search'

const { suggestions } = defineProps<{ suggestions: SearchResult[] }>()

const emit = defineEmits<{ (e: 'select', suggestion: SearchResult): void }>()

const handleClick = (suggestion: SearchResult) => {
  emit('select', suggestion)
}
</script>

<template>
  <div class="dropdown-container">
    <ul class="dropdown-list">
      <li
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.id"
        @click="handleClick(suggestion)"
        class="dropdown-item"
        :style="{ animationDelay: `${index * 30}ms` }"
      >
        <div class="item-content">
          <svg
            class="location-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span class="address-text">{{ suggestion.address }}</span>
        </div>
        <svg
          class="arrow-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dropdown-container {
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(209, 213, 219, 0.6);
  border-radius: 0.875rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.08),
    0 10px 20px -5px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  overflow: hidden;
  margin-top: 0.5rem;
}

.dropdown-list {
  max-height: 280px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0.375rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}

.dropdown-list::-webkit-scrollbar {
  width: 6px;
}

.dropdown-list::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-list::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 3px;
}

.dropdown-list::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.6);
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 0.625rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideIn 0.25s ease-out both;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.08));
  transform: translateX(4px);
}

.dropdown-item:active {
  transform: translateX(4px) scale(0.99);
}

.item-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.location-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #6366f1;
  opacity: 0.8;
  transition: all 0.2s ease;
}

.dropdown-item:hover .location-icon {
  opacity: 1;
  transform: scale(1.1);
}

.address-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.dropdown-item:hover .address-text {
  color: #1f2937;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #9ca3af;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.2s ease;
}

.dropdown-item:hover .arrow-icon {
  opacity: 1;
  transform: translateX(0);
  color: #6366f1;
}
</style>
