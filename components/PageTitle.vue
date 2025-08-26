<template>
  <header :class="['flex items-start justify-between gap-3', wrapperClass]">
    <!-- Left: Title & subtitle -->
    <div class="flex-1 min-w-0">
      <h1 :class="headingClass" :title="title">
        <slot name="icon" />
        <span class="tracking-tighter uppercase truncate">{{ title }}</span>
      </h1>
      <p v-if="subtitle || $slots.subtitle" class="mt-1 text-sm truncate opacity-70">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>

    <!-- Right: Actions -->
    <div v-if="$slots.actions" class="shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** Main title text */
  title: string
  /** Optional subtitle (or provide via `#subtitle` slot) */
  subtitle?: string
  /** Size preset */
  size?: 'sm' | 'md' | 'lg'
  /** Extra classes for the outer wrapper */
  wrapperClass?: string
  /** Use Kryptos display font for the title */
  display?: boolean
}>(), {
  size: 'md',
  subtitle: '',
  wrapperClass: '',
  display: false,
})

const headingClass = computed(() => {
  const base = 'sm:tracking-tight sm:truncate flex items-center gap-2'
  const size = props.size === 'lg'
    ? 'text-3xl font-bold'
    : props.size === 'sm'
    ? 'text-xl font-semibold'
    : 'text-2xl font-bold'
  const color = 'text-gray-900'
  const face = props.display ? 'font-kryptos' : 'font-sans'
  return `${base} ${size} ${color} ${face}`
})
</script>

<style scoped>
</style>
