<template>
  <div class="p-1 mt-2 border border-primary">
    <h2 class="mb-2 text-lg">Highlight letters</h2>

    <!-- Controls -->
    <div class="flex items-center gap-3 mb-3 text-sm">
      <label class="mr-2">Color:</label>
      <input :value="color" type="color" @input="onColor(($event.target as HTMLInputElement).value)" />
      <button class="px-2 py-1 text-sm" @click="clearAll">Clear</button>
      <button class="px-2 py-1 text-sm" @click="highlightVowels">Vowels</button>
      <button class="px-2 py-1 text-sm" @click="highlightConsonants">Consonants</button>
    </div>

    <!-- Alphabet buttons -->
    <div class="flex flex-wrap gap-1 mb-1 text-black">
      <button
        v-for="ch in letters" :key="ch"
        class="w-8 h-8 font-bold border rounded font-kryptos"
        :class="{ 'bg-gray-300': isActive(ch) }"
        @click="toggle(ch)"
      >
        {{ ch }}
      </button>
    </div>

    <!-- Custom set -->
    <div class="flex items-center gap-2 mt-2 text-sm">
      <input v-model="customSet" placeholder="type letters…" class="p-1 text-black border border-gray-400 rounded" />
      <button class="px-2 py-1" @click="applyCustom(true)">Add</button>
      <button class="px-2 py-1" @click="applyCustom(false)">Remove</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Reusable panel to manage per-letter highlight colors.
 * v-model:highlights -> Record<string, string> (e.g., { A: '#ff0' })
 * v-model:color      -> default color used when toggling letters on
 */

const props = withDefaults(defineProps<{
  highlights?: Record<string, string>
  color?: string
  alphabet?: string[]
}>(), {
  highlights: () => ({}),
  color: '#ffff00',
  alphabet: () => Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
})

const emit = defineEmits<{
  (e: 'update:highlights', v: Record<string, string>): void
  (e: 'update:color', v: string): void
}>()

const letters = computed(() => props.alphabet)
const customSet = ref('')

function onColor(val: string) {
  emit('update:color', val)
}

function isActive(letter: string) {
  return !!props.highlights?.[letter.toUpperCase()]
}

function toggle(letter: string) {
  const L = letter.toUpperCase()
  const map = { ...(props.highlights || {}) }
  if (map[L]) delete map[L]
  else map[L] = props.color || '#ffff00'
  emit('update:highlights', map)
}

function clearAll() {
  emit('update:highlights', {})
}

function highlightVowels() {
  const map = { ...(props.highlights || {}) }
  const vowels = ['A', 'E', 'I', 'O', 'U']
  for (const v of vowels) map[v] = props.color || '#ffff00'
  emit('update:highlights', map)
}

function highlightConsonants() {
  const map = { ...(props.highlights || {}) }
  const vowels = new Set(['A', 'E', 'I', 'O', 'U'])
  for (const L of letters) if (!vowels.has(L)) map[L] = props.color || '#ffff00'
  emit('update:highlights', map)
}

function applyCustom(add: boolean) {
  const set = new Set((customSet.value || '').toUpperCase().replace(/[^A-Z]/g, '').split(''))
  const map = { ...(props.highlights || {}) }
  for (const L of set) {
    if (add) map[L] = props.color || '#ffff00'
    else delete map[L]
  }
  emit('update:highlights', map)
}
</script>

<style scoped>
</style>
