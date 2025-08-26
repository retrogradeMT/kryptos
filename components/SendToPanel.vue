<script lang="ts" setup>
import { useRouter } from '#imports'
import { computed, onMounted } from 'vue'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useClipboard } from '~/composables/useClipboard'
import { useToolBus } from '~/composables/useToolBus'
import { seedOptions, textSeeds } from '~/lib/textSeeds'

// Props & emits
const props = withDefaults(defineProps<{
  text?: string
  mode?: 'freetext' | 'wordlist' | 'morse'
  listen?: boolean
  targets?: Array<{ label: string, path: string, query?: Record<string, any> }>
}>(), {
  text: '',
  mode: 'freetext',
  listen: true,
  targets: () => [],
})

const emit = defineEmits<{
  (e: 'update:text', v: string): void
  (e: 'update:mode', v: 'freetext' | 'wordlist' | 'morse'): void
}>()

// Two-way bindings
const text = computed({
  get: () => props.text ?? '',
  set: v => emit('update:text', v || ''),
})
const mode = computed({
  get: () => props.mode ?? 'freetext',
  set: v => emit('update:mode', v),
})

// Tool bus hookup (so other tools can push text here)
const bus = useToolBus()
onMounted(() => {
  if (!props.listen)
    return
  try {
    bus.value?.on?.('sendto:setText', (payload: any) => {
      if (!payload)
        return
      if (typeof payload.text === 'string')
        text.value = payload.text
    })
  }
  catch {}
})

// Clipboard helpers
const { copy } = useClipboard()
async function pasteFromClipboard() {
  try {
    const t = await navigator.clipboard.readText()
    if (t)
      text.value = t
  }
  catch {}
}
function copyAll() {
  if (text.value)
    copy(text.value)
}
function clearAll() { text.value = '' }

// Seeds
function applySeed(key: keyof typeof textSeeds) {
  text.value = textSeeds[key] || ''
}

// Navigate to targets without shoving text in the query (shared state handles it)
const router = useRouter()
async function openTarget(tgt: { label: string, path: string, query?: Record<string, any> }) {
  try { await router.push({ path: tgt.path, query: tgt.query || {} }) }
  catch {}
}
</script>

<template>
  <div class="p-3 border rounded bg-white/70">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold">
        Send To
      </h3>
      <div class="text-xs opacity-60">
        Shared payload hub
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2 mt-2 text-sm">
      <!-- Seed dropdown -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="px-2 py-1 border rounded">
            Seed…
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-72">
          <DropdownMenuLabel>Load predefined text</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem v-for="opt in seedOptions" :key="opt.key" @click="applySeed(opt.key as any)">
              {{ opt.label }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Clipboard helpers -->
      <button class="px-2 py-1 border rounded" @click="pasteFromClipboard">
        Paste
      </button>
      <button class="px-2 py-1 border rounded" :disabled="!text" @click="copyAll">
        Copy
      </button>
      <button class="px-2 py-1 border rounded" :disabled="!text" @click="clearAll">
        Clear
      </button>
    </div>

    <!-- Text area -->
    <div class="mt-2">
      <textarea v-model="text" rows="6" class="w-full p-2 font-mono text-black border rounded" placeholder="Type, paste, or seed text…"></textarea>
    </div>

    <!-- Targets -->
    <div v-if="props.targets?.length" class="flex flex-wrap gap-2 mt-3">
      <button v-for="tgt in props.targets" :key="tgt.label" class="px-2 py-1 border rounded" @click="openTarget(tgt)">
        {{ tgt.label }}
      </button>
    </div>
  </div>
</template>

<style scoped></style>
