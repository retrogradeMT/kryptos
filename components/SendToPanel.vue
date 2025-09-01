<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useClipboard } from '~/composables/useClipboard'
import { useGlobalState } from '~/composables/useGlobalState'
import { useToolBus } from '~/composables/useToolBus'
import { seedOptions, textSeeds } from '~/lib/TextSeeds'

const { currentText, setCurrentText, updateCurrentText } = useGlobalState()
const updateNow: (t: string) => void = (updateCurrentText as any) ?? ((t: string) => { currentText.value = t })

const rawText = ref<string>('')

const lastPushed = ref('')
const SOURCE_ID = 'SendToPanel'
const isSyncingFromGlobal = ref(false)

function applyReverse() {
  if (!rawText.value)
    return
  rawText.value = rawText.value.split('').reverse().join('')
}
function applyStripSpaces() {
  if (!rawText.value)
    return
  rawText.value = rawText.value.replace(/\s+/g, '')
}
function applyAlphaOnly() {
  if (!rawText.value)
    return
  rawText.value = rawText.value.replace(/[^A-Z]/gi, '')
}

onMounted(() => {
  try {
    rawText.value = currentText.value || ''
  }
  catch {}
})

watch(rawText, (next) => {
  if (typeof next !== 'string')
    return
  if (isSyncingFromGlobal.value)
    return
  if (next === lastPushed.value)
    return
  if (next === (currentText.value || ''))
    return
  lastPushed.value = next
  try { updateNow(next) }
  catch {}
}, { flush: 'post' })

function loadFromGlobal() {
  const incoming = currentText.value || ''
  if (incoming !== rawText.value) {
    isSyncingFromGlobal.value = true
    rawText.value = incoming
    Promise.resolve().then(() => { isSyncingFromGlobal.value = false })
  }
}

function saveToGlobal() {
  const payload = rawText.value || ''
  const note = 'SendToPanel (applied)'
  try { setCurrentText(payload, SOURCE_ID, note) }
  catch {}
}

// Tool bus hookup (so other tools can push text here)
const bus = useToolBus()
onMounted(() => {
  try {
    bus.value?.on?.('sendto:setText', (payload: any) => {
      if (!payload)
        return
      if (payload.source === SOURCE_ID)
        return // ignore our own emissions
      if (typeof payload.text === 'string' && payload.text !== rawText.value) {
        rawText.value = payload.text
      }
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
      rawText.value = t
  }
  catch {}
}
function copyAll() {
  if (rawText.value)
    copy(rawText.value)
}
function clearAll() { rawText.value = '' }

// Seeds
function applySeed(key: keyof typeof textSeeds) {
  rawText.value = textSeeds[key] || ''
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
      <button class="px-2 py-1 border rounded" :disabled="!rawText || !rawText.length" @click="copyAll">
        Copy
      </button>
      <button class="px-2 py-1 border rounded" :disabled="!rawText" @click="clearAll">
        Clear
      </button>
      <button class="px-2 py-1 border rounded" @click="loadFromGlobal">
        Load Global
      </button>
      <button class="px-2 py-1 border rounded" :disabled="!rawText || !rawText.length" @click="saveToGlobal">
        Add To Saved History
      </button>

      <!-- Transform tools (one‑shot, in‑place) -->
      <button class="px-2 py-1 border rounded" :disabled="!rawText" @click="applyReverse">
        Reverse
      </button>
      <button class="px-2 py-1 border rounded" :disabled="!rawText" @click="applyStripSpaces">
        Remove spaces/newlines
      </button>
      <button class="px-2 py-1 border rounded" :disabled="!rawText" @click="applyAlphaOnly">
        Keep alphabetic only
      </button>
    </div>

    <!-- Text area -->
    <div class="grid gap-2 mt-2">
      <textarea v-model="rawText" rows="6" class="w-full p-2 font-mono text-black border rounded" placeholder="Type, paste, or seed text…"></textarea>
    </div>
  </div>
</template>

<style scoped></style>
