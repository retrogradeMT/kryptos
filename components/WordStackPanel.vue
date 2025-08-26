<template>
  <div class="p-1 mt-2 border border-primary">
    <h2 class="mb-2 text-lg">Word Stack</h2>

    <div class="flex items-center gap-2 mb-2 text-sm">
      <input v-model="newItem" placeholder="add word…" class="flex-1 p-1 text-black border border-gray-400 rounded" @keyup.enter="add" />
      <button class="px-2 py-1" @click="add">Add</button>
      <button class="px-2 py-1" @click="clear">Clear</button>
    </div>

    <ol class="space-y-1 text-sm">
      <li v-for="(item, idx) in items" :key="idx" class="flex items-center gap-2">
        <span class="w-6 text-right opacity-60">{{ idx+1 }}.</span>
        <input
          :value="item"
          @input="update(idx, ($event.target as HTMLInputElement).value)"
          class="flex-1 p-1 text-black border border-gray-300 rounded"
        />
        <div class="flex items-center gap-1">
          <button class="px-2 py-1" @click="move(idx, -1)" :disabled="idx===0">↑</button>
          <button class="px-2 py-1" @click="move(idx, +1)" :disabled="idx===items.length-1">↓</button>
          <button class="px-2 py-1" @click="removeIdx(idx)">✕</button>
        </div>
      </li>
    </ol>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{ items?: string[] }>(), { items: () => [] })
const emit = defineEmits<{ (e:'update:items', v:string[]): void }>()

const items = computed(() => props.items)
const newItem = ref('')

function add() { const v = newItem.value.trim(); if (!v) return; emit('update:items', [...items, v]); newItem.value=''}
function clear() { emit('update:items', []) }
function removeIdx(i:number) { const a = items.slice(); a.splice(i,1); emit('update:items', a) }
function move(i:number, d:number) {
  const j = i + d; if (j < 0 || j >= items.length) return
  const a = items.slice(); const tmp = a[i]; a[i] = a[j]; a[j] = tmp; emit('update:items', a)
}
function update(i:number, v:string) { const a = items.slice(); a[i] = v; emit('update:items', a) }
</script>

<style scoped></style>
