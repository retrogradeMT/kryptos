<template>
  <div class="p-1 mt-2 border border-primary">
    <h2 class="mb-2 text-lg">Find Word</h2>

    <div class="flex flex-wrap items-center gap-3 mb-2 text-sm">
      <input
        :value="query"
        @input="onUpdate('query', ($event.target as HTMLInputElement).value)"
        placeholder="search…"
        class="p-1 text-black border border-gray-400 rounded"
      />

      <label>Mode
        <select :value="mode" @change="onUpdate('mode', ($event.target as HTMLSelectElement).value)" class="ml-1 text-black">
          <option value="rows">Rows</option>
          <option value="cols">Columns</option>
          <option value="diagDown">Diag ↓→ (wrap)</option>
          <option value="diagUp">Diag ↑→ (wrap)</option>
          <option value="all">All (8 dirs)</option>
        </select>
      </label>

      <label class="ml-2">
        <input type="checkbox" :checked="wrap" @change="onUpdate('wrap', ($event.target as HTMLInputElement).checked)" />
        Wrap
      </label>

      <label class="ml-2">
        <input type="checkbox" :checked="backwards" @change="onUpdate('backwards', ($event.target as HTMLInputElement).checked)" />
        Backwards
      </label>

      <label class="ml-2">Color
        <input type="color" :value="color" @input="onUpdate('color', ($event.target as HTMLInputElement).value)" class="ml-1" />
      </label>

      <template v-if="showDiameter">
        <label class="ml-2">Diameter
          <input
            type="number"
            :min="minDiameter"
            :max="maxDiameter"
            :value="diameter"
            @input="onUpdate('diameter', toNumber(($event.target as HTMLInputElement).value))"
            class="w-16 p-1 ml-1 text-black"
          />
        </label>
      </template>

      <button class="px-2 py-1 text-sm" @click="onUpdate('query', '')">Clear</button>
    </div>

    <div v-if="typeof matchesCount === 'number'" class="text-xs text-gray-400">
      Matches: {{ matchesCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Reusable find panel with v-model bindings.
 * Intended to live in tools.vue sidebar and be used by child routes.
 *
 * Props use the `modelValue`-style contract per key, but we keep them simple via `v-model:prop` usage.
 */

const props = withDefaults(defineProps<{
  query?: string
  mode?: 'rows' | 'cols' | 'diagDown' | 'diagUp' | 'all'
  wrap?: boolean
  backwards?: boolean
  color?: string
  diameter?: number
  showDiameter?: boolean
  minDiameter?: number
  maxDiameter?: number
  matchesCount?: number | null
}>(), {
  query: '',
  mode: 'all',
  wrap: true,
  backwards: true,
  color: '#ffd54f',
  diameter: 16,
  showDiameter: true,
  minDiameter: 2,
  maxDiameter: 40,
  matchesCount: null,
})

const emit = defineEmits<{
  (e: 'update:query', v: string): void
  (e: 'update:mode', v: 'rows' | 'cols' | 'diagDown' | 'diagUp' | 'all'): void
  (e: 'update:wrap', v: boolean): void
  (e: 'update:backwards', v: boolean): void
  (e: 'update:color', v: string): void
  (e: 'update:diameter', v: number): void
}>()

function onUpdate<K extends 'query' | 'mode' | 'wrap' | 'backwards' | 'color' | 'diameter'>(key: K, value: any) {
  emit(`update:${key}` as any, value)
}

function toNumber(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// expose for template (optional)
const query = computed(() => props.query)
const mode = computed(() => props.mode)
const wrap = computed(() => props.wrap)
const backwards = computed(() => props.backwards)
const color = computed(() => props.color)
const diameter = computed(() => props.diameter)
const showDiameter = computed(() => props.showDiameter)
const minDiameter = computed(() => props.minDiameter)
const maxDiameter = computed(() => props.maxDiameter)
const matchesCount = computed(() => props.matchesCount)
</script>

<style scoped>
</style>
