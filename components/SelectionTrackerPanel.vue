<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useClipboard } from '~/composables/useClipboard'
import { useToolBus } from '~/composables/useToolBus'

const props = withDefaults(defineProps<{
  selections?: string[]
  joinWith?: string
  autoSend?: boolean
}>(), {
  selections: () => [],
  joinWith: '\n',
  autoSend: true,
})

const emit = defineEmits<{ (e: 'clear'): void, (e: 'removeLast'): void }>()

const items = computed(() => props.selections || [])
const joined = computed(() => items.value.join(props.joinWith))

const { copy } = useClipboard()
function copyAll() {
  if (joined.value)
    copy(joined.value)
}
function copyOne(i: number) {
  const s = items.value[i]; if (s)
    copy(s)
}
function clearAll() { emit('clear') }
function removeLast() { emit('removeLast') }

const bus = useToolBus()
watch([items, () => props.joinWith, () => props.autoSend], () => {
  if (!props.autoSend)
    return
  try {
    bus.value?.emit?.('sendto:setText', {
      text: joined.value,
      meta: { source: 'SelectionTracker', autosent: true, count: items.value.length },
    })
  }
  catch {}
}, { immediate: true })
</script>

<template>
  <div class="p-3 border rounded bg-white/70">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold">
        Selection Tracker
      </h3>
      <div class="text-xs opacity-60">
        Auto-sends to Send To
      </div>
    </div>

    <div class="pr-1 mt-2 space-y-2 overflow-auto max-h-64">
      <div v-if="!items.length" class="text-sm opacity-60">
        No selections yet.
      </div>
      <div v-for="(s, i) in items" :key="i" class="flex items-start gap-2">
        <code class="flex-1 block p-2 text-xs whitespace-pre-wrap border rounded bg-white/60">{{ s }}</code>
        <button class="px-2 py-1 text-xs border rounded" @click="copyOne(i)">
          Copy
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 mt-3 text-sm">
      <button class="px-2 py-1 border rounded" :disabled="!items.length" @click="copyAll">
        Copy All
      </button>
      <button class="px-2 py-1 border rounded" :disabled="!items.length" @click="removeLast">
        Remove Last
      </button>
      <button class="px-2 py-1 border rounded" :disabled="!items.length" @click="clearAll">
        Clear
      </button>
      <label class="flex items-center gap-2 ml-auto text-xs">
        <input type="checkbox" class="accent-black" :checked="props.autoSend" @change="$emit('update:autoSend', ($event.target as HTMLInputElement).checked)" />
        Auto-send
      </label>
    </div>

    <div class="mt-2">
      <label class="text-xs opacity-70">Join with</label>
      <input class="px-2 py-1 ml-2 text-xs border rounded w-36" :value="props.joinWith" @input="$emit('update:joinWith', ($event.target as HTMLInputElement).value)" />
    </div>
  </div>
</template>

<style scoped></style>
