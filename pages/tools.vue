<script setup lang="ts">
import { useRoute, useRouter } from '#imports'

import { useStorage } from '@vueuse/core'

import DiameterPanel from '~/components/DiameterPanel.vue'
import FindWordPanel from '~/components/FindWordPanel.vue'
import HighlightPanel from '~/components/HighlightPanel.vue'
import LetterFrequencyPanel from '~/components/LetterFrequencyPanel.vue'
import OffsetPanel from '~/components/OffsetPanel.vue'
import OrientationPanel from '~/components/OrientationPanel.vue'
import PageTitle from '~/components/PageTitle.vue'
import PrintToggle from '~/components/PrintToggle.vue'
import SelectionTrackerPanel from '~/components/SelectionTrackerPanel.vue'
import SendToPanel from '~/components/SendToPanel.vue'
import ToolMenu from '~/components/toolMenu.vue'
import WordStackPanel from '~/components/WordStackPanel.vue'
import { useCipherState } from '~/composables/useCipherState'
import { useToolBus } from '~/composables/useToolBus'
import { useUrlState } from '~/composables/useUrlState'

const bus = useToolBus()
onMounted(() => {
  try {
    bus.value?.on?.('sendto:setText', (p: any) => {
      if (p?.text)
        payloadText.value = String(p.text)
    })
  }
  catch { }
})

const orientation = ref<'normal' | 'tree' | 'roots'>('normal')
// Find panel UI state
const diameter = ref(16)
const highlightColor = ref('#ffff00')
const letterHighlights = useStorage('letterHighlights', {})
const caseSensitive = ref(false)
const includeNonAlpha = ref(false)
const selections = ref <string[]> ([])

// Find panel UI state
const find = reactive({
  query: '',
  mode: 'all' as 'rows' | 'cols' | 'diagDown' | 'diagUp' | 'all',
  wrap: true,
  backwards: true,
  color: '#ffd54f',
  diameter: diameter.value,
  matches: 0,
})
watch(() => diameter.value, d => (find.diameter = d))

// TODO: hook find.matches to your actual scanning on the active view (DMS/copperplate/rails)

const padChar = ref(' ')

watch(orientation, (mode) => {
  // Keep backward compatibility with existing flags
  if (mode === 'normal') { reverseRows.value = false; reverseColumns.value = false }
  if (mode === 'tree') { /* tree = CCW rotate grid before render */ }
  if (mode === 'roots') { /* roots = CW rotate grid before render */ }
})

watch(orientation, (v) => {
  const q = { ...route.query, orientation: v }
  router.replace({ query: q }).catch(() => {})
})

// watch(printMode, (enabled) => {
//   const q: Record<string, any> = { ...route.query }
//   if (enabled) q.print = '1'
//   else delete q.print
//   router.replace({ query: q }).catch(() => {})
// })

const stackReversedRail = ref(false)
const reverseRailOffset = ref(0)
const visualShift = ref(0)
const reverseVisualShift = ref(0)
const verticalStackOffset = ref(0)

const route = useRoute()
const router = useRouter()
// const { textSource, gridOrientation, letterHighlights, selection } = useCipherState()

const meta = computed(() => route.meta || {})
const controls = computed(() => meta.value.controls || {})
const urlSchema = computed(() => meta.value.urlState || {})

// centralize URL <-> state here:
const { decode, encode } = useUrlState(urlSchema)
watch(() => route.query, (q) => {
  try { decode(q) }
  catch { }
}, { immediate: true })
// If/when you reintroduce textSource/gridOrientation, re-enable this:
// watch([textSource, gridOrientation], () => { router.replace({ query: encode() }).catch(() => {}) })
const wordColors = [
  '#fca5a5',
  '#fdba74',
  '#fcd34d',
  '#a7f3d0',
  '#93c5fd',
  '#c4b5fd',
  '#f9a8d4',
  '#f87171',
  '#fb923c',
  '#f59e0b',
  '#34d399',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
]
const inputMode = ref('wordlist') // 'wordlist' | 'freetext' | 'morse'
const freeText = ref('')
const morseInput = ref('')
const morseDot = ref('.')
const morseDash = ref('-')
const morseMapStyle = ref('12') // '12' (dot→1 dash→2) or '01' (dot→0 dash→1)
const printMode = ref(false)

// leave this here
const morseWordsInputsWithE = ref([
  'EEVIRTUALLYE',
  'EEEEEEINVISIBLE',
  'EESHADOWEE',
  'FORCESEEEEE',
  'LUCIDEEE',
  'MEMORYE',
  'RQ',
  'SOS',
  'EDIGETALEEE',
  'INTERPRETATIO',
  'TISYOUR',
  'POSITIONE',
])

const morseWordsInputs = [
  'VIRTUALLY',
  'INVISIBLE',
  'SHADOW',
  'FORCES',
  'LUCID',
  'MEMORY',
  'RQ',
  'SOS',
  'DiGETAL',
  'INTERPRETATIU',
  'TISYOUR',
  'POSITION',
]

const wordInputs = ref([
  'SLOWLY',
  'RAPSED',
  'ATLYSL',
  'HTYLWO',
  'EREMAI',
  'APFOSN',
  'SSAGED',
  'TSIRBE',
  'HATENC',
  'EREBMU',
  'DTHELO',
  'RAPREW',
  'TOFTHE',
  'AWROOD',
  'YWASRE',
  'WDEVOM',
  'ITHTRE',
  'GNILBM',
  'HANDSI',
  'TAEDAM',
  'INYBRE',
  'TNIHCA',
  'HEUPPE',
  'HTFELR',
  'ANDCOR',
  'DNAREN',
  'THENWI',
  'GNINED',
  'THEHOL',
  'TTILAE',
  'LEIINS',
  'TDETRE',
  'HECAND',
  'PDNAEL',
  'EEREDI',
  'OHEHTN',
  'TAIRES',
  'GNIPAC',
  'FROMTH',
  'BMAHCE',
  'ERCAUS',
  'FEHTDE',
  'LAMETO',
  'EKCILF',
  'RBUTPR',
  'LTNESE',
  'YDETAI',
  'HTFOSL',
  'EROOMW',
  'ENIHTI',
  'MERGED',
  'HTMORF',
  'EMISTX',
  'UOYNAC',
  'SEEANY',
  'QGNIHT',
])

const wordInputsWithE = ref([

])
const payloadText = useStorage('payload:text', '')
const payloadMode = useStorage('payload:mode', 'freetext')
const useExtendedWords = ref(false)
const activeWordSet = computed(() => useExtendedWords.value ? wordInputsWithE.value : wordInputs.value)
const diameterScanResults = ref([])

const reverseRows = ref(false)
const reverseColumns = ref(false)
const offset = ref(0)

const selectedCells = ref([])

const tineLength = ref(5)

const dictionary = [
  // Intelligence / CIA terms
  'CIA',
  'NSA',
  'FBI',
  'KGB',
  'SPY',
  'AGENT',
  'CIPHER',
  'DECRYPT',
  'ENCRYPT',
  'SAFEHOUSE',
  'ESCAPE',
  'INFILTRATE',
  'MOLE',
  'SURVEILLANCE',
  'ESPIONAGE',
  'DISINFORMATION',
  'CODEBOOK',
  'VENONA',
  'CODE',
  'SECRET',
  // Rosenberg case
  'ROSENBERG',
  'ETHEL',
  'JULIUS',
  'EXECUTE',
  'ELECTRIC',
  'CHAIR',
  'DEATH',
  'SENTENCE',
  'LEAK',
  'PLEAD',
  // Cold War & USSR
  'SOVIET',
  'USSR',
  'MOSCOW',
  'BERLIN',
  'EAST',
  'WEST',
  'IRONCURTAIN',
  'KGB',
  'WARSAW',
  'PACT',
  'GULAG',
  'STASI',
  'PROPAGANDA',
  'POLITBURO',
  'COMINTERN',
  'LUBYANKA',
  // Cold War figures
  'STALIN',
  'KHRUSHCHEV',
  'BREZHNEV',
  'TRUMAN',
  'KENNEDY',
  'EISENHOWER',
  'BERIA',
  'COLDWAR',
  // Germany / Berlin Wall
  'BERLINWALL',
  'BERLIN',
  'CHECKPOINT',
  'ALPHA',
  'BRAVO',
  'CHARLIE',
  'GUARDTOWER',
  'TUNNEL',
  'REUNIFICATION',
  // Spy operations
  'MKULTRA',
  'PAPERCLIP',
  'MOCKINGBIRD',
  'BLACKBIRD',
  'U2',
  'SR71',
  // Space Race
  'SPUTNIK',
  'VOSTOK',
  'GAGARIN',
  'COSMONAUT',
  'NASA',
  'MERCURY',
  'APOLLO',
  'SPACE',
  // Kryptos-specific
  'SHADOW',
  'POSITION',
  'YOURSELF',
  'PALIMPSEST',
  'IQLUSION',
  'UNDERGROUND',
  'MESSAGE',
  'DOCUMENT',
]

const flatText = computed(() => {
  if (inputMode.value === 'wordlist') {
    return activeWordSet.value.join('')
  }
  else if (inputMode.value === 'freetext') {
    return freeText.value.replace(/\s+/g, '').toUpperCase()
  }
  else {
    // Robust Morse normalization: accept common dot/dash variants and direct binary
    const dotSet = new Set(['.', '·', '•', '∙', '●', morseDot.value])
    const dashSet = new Set(['-', '–', '—', '−', '_', '━', '─', morseDash.value])

    const s = morseInput.value.normalize('NFKC')
    let out = ''
    for (const raw of s) {
      const ch = raw.trim()
      if (!ch)
        continue
      if (dotSet.has(ch)) {
        out += (morseMapStyle.value === '12' ? '1' : '0')
      }
      else if (dashSet.has(ch)) {
        out += (morseMapStyle.value === '12' ? '2' : '1')
      }
      else if (morseMapStyle.value === '01' && (ch === '0' || ch === '1')) {
        // Allow direct 0/1 input when mapping is 01
        out += ch
      }
      else if (morseMapStyle.value === '12' && (ch === '1' || ch === '2')) {
        // Allow direct 1/2 input when mapping is 12
        out += ch
      }
      // All other characters (slashes, pipes, etc.) are treated as separators and ignored
    }
    return out
  }
})

function getWrappedGrid(d, useExtended = useExtendedWords.value) {
  let flat
  if (inputMode.value === 'wordlist') {
    flat = (useExtended ? wordInputsWithE.value : wordInputs.value).join('')
  }
  else if (inputMode.value === 'morse') {
    // In Morse mode, load the predefined word lists into the scytale grid (dots/dashes handled later)
    flat = (useExtended ? morseWordsInputsWithE.value : morseWordsInputs.value).join('')
  }
  else {
    // freetext path
    flat = flatText.value
  }
  const rows = Math.ceil(flat.length / d)
  const rotated = flat.slice(offset.value) + flat.slice(0, offset.value)
  const padded = rotated.padEnd(rows * d, '.')

  const colorSource = (
    inputMode.value === 'wordlist'
      ? (useExtended ? wordInputsWithE.value : wordInputs.value)
      : inputMode.value === 'morse'
        ? (useExtended ? morseWordsInputsWithE.value : morseWordsInputs.value)
        : [flat]
  )
  const letterColorMap = []
  colorSource.forEach((word, wordIdx) => {
    for (let i = 0; i < word.length; i++) {
      letterColorMap.push(wordColors[wordIdx])
    }
  })

  const colorRotated = [
    ...letterColorMap.slice(offset.value),
    ...letterColorMap.slice(0, offset.value),
  ]
  const colorPadded = [...colorRotated, ...Array.from({ length: rows * d - colorRotated.length }).fill('#ffffff')]

  const grid = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < d; c++) {
      const idx = r + c * rows
      const char = padded[idx]
      const color = letterHighlights.value[char?.toUpperCase()] || colorPadded[idx]
      row.push({ char, color, row: r, col: c })
    }
    grid.push(row)
  }

  let finalGrid = [...grid]
  if (reverseRows.value)
    finalGrid = finalGrid.map(row => row.reverse())
  if (reverseColumns.value)
    finalGrid = finalGrid.reverse()
  return finalGrid
}

const wrappedGrid = computed(() => getWrappedGrid(diameter.value))

const displayText = computed(() => {
  const outputString = wrappedGrid.value
    .map(row => row.map(cell => cell.char).join(''))
    .join('')
  return outputString.replace(/\./g, '').toLowerCase()
})
function wordScan(str, dictionarySet) {
  const hits = []
  const n = str.length
  for (let i = 0; i < n; i++) {
    for (let word of dictionarySet) {
      const len = word.length
      if (i + len <= n && str.substring(i, i + len) === word) {
        hits.push({ word, position: i })
      }
    }
  }
  return hits
}
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

async function fullDiameterSweep() {
  const maxDiameter = 28
  const allResults = []
  for (let d = 2; d <= maxDiameter; d++) {
    diameter.value = d

    await new Promise(resolve => setTimeout(resolve, 10)) // allows UI to update

    const outputString = wrappedGrid.value
      .map(row => row.map(cell => cell.char).join(''))
      .join('')
    const cleanedString = outputString.replace(/\./g, '').toLowerCase()

    const hits = wordScan(cleanedString, dictionarySet)
    allResults.push({ diameter: d, hits: hits.length })
  }
  diameterScanResults.value = allResults
}

const dictionarySet = new Set(dictionary.map(word => word.toLowerCase()))

function swap(arr, i, j) {
  const temp = arr[i]
  arr[i] = arr[j]
  arr[j] = temp
}

const hiddenDiameters = ref(new Set([1]))
const trails = useStorage('trails', {})
const currentDiameter = ref(null)
const trailInputs = ref({})

function handleCellClick(cell) {
  const key = `${cell.row}-${cell.col}-${cell.diameter}`
  if (currentDiameter.value === null)
    return
  const trailsForD = trailInputs.value[currentDiameter.value] || []
  const activeTrail = trailsForD.find(t => t.name)
  if (!activeTrail)
    return
  const trailKey = `${currentDiameter.value}:${activeTrail.name}`
  if (!trails.value[trailKey]) {
    trails.value[trailKey] = { color: activeTrail.color || '#ddd580', cells: [] }
  }
  const cellIndex = trails.value[trailKey].cells.findIndex(c => c.key === key)
  if (cellIndex === -1) {
    trails.value[trailKey].cells.push({ ...cell, key })
  }
  else {
    trails.value[trailKey].cells.splice(cellIndex, 1)
  }
  // simple selection tracker
  const selKey = `${cell.row}-${cell.col}-${cell.diameter}`
  const i = selectedCells.value.findIndex(c => c.key === selKey)
  if (i === -1) {
    selectedCells.value.push({ ...cell, key: selKey, order: selectedCells.value.length + 1 })
  }
  else {
    selectedCells.value.splice(i, 1)
    selectedCells.value.forEach((c, idx) => { c.order = idx + 1 })
  }
}

const dashboardHeight = ref(300)
const isResizing = ref(false)
function onDragStart(e) {
  isResizing.value = true
  const startY = e.clientY
  const startH = dashboardHeight.value
  const onMove = (ev) => {
    const dy = ev.clientY - startY
    dashboardHeight.value = Math.max(120, startH + dy)
  }
  const onUp = () => {
    isResizing.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function onKeyResize(ev: KeyboardEvent) {
  const step = 16
  if (ev.key === 'ArrowUp') {
    dashboardHeight.value = Math.max(120, dashboardHeight.value - step)
  }
  else if (ev.key === 'ArrowDown') {
    dashboardHeight.value = dashboardHeight.value + step
  }
  else {
    return
  }
  ev.preventDefault()
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header class="px-4 py-2 border-b">
      <PageTitle title="Kryptos Tools" />
      <ToolMenu />
    </header>

    <!-- Main layout: Dashboard (top), Resizer, Child Content (bottom) -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Dashboard (moved from aside) -->
      <section class="overflow-auto border-b bg-white/60 backdrop-blur" :style="{ height: `${dashboardHeight}px` }">
        <div class="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-1">
          <OrientationPanel
            v-if="controls.orientation" v-model:orientation="orientation" v-model:pad-char="padChar"
            :show-pad="true"
          />
          <OffsetPanel
            v-if="controls.offset" v-model:offset="offset" v-model:stack-reversed-rail="stackReversedRail"
            v-model:reverse-rail-offset="reverseRailOffset" v-model:visual-shift="visualShift"
            v-model:reverse-visual-shift="reverseVisualShift" v-model:vertical-stack-offset="verticalStackOffset"
          />
          <DiameterPanel
            v-if="controls.diameter" v-model:diameter="diameter" :min="2" :max="80" :step="1"
            hint="Columns for scytale wrap" @sweep="fullDiameterSweep"
          />
          <FindWordPanel
            v-if="controls.find" v-model:query="find.query" v-model:mode="find.mode"
            v-model:wrap="find.wrap" v-model:backwards="find.backwards" v-model:color="find.color"
            v-model:diameter="find.diameter" :matches-count="find.matches"
          />
          <HighlightPanel
            v-if="controls.highlights" v-model:highlights="letterHighlights"
            v-model:color="highlightColor"
          />
          <LetterFrequencyPanel
            v-if="controls.letterFrequency" v-model:case-sensitive="caseSensitive"
            v-model:include-non-alpha="includeNonAlpha" :text="displayText"
          />
          <WordStackPanel v-if="controls.wordStack" v-model:items="wordInputs" />

          <PrintToggle v-if="controls.print" v-model:enabled="printMode" />
          <SendToPanel
            v-model:text="payloadText" v-model:mode="payloadMode"
            :targets="Array.isArray(controls.sendTo) ? controls.sendTo : []"
          />
        </div>
      </section>

      <!-- Resizer -->

      <!-- Child content full-width -->
      <section class="flex-1 p-4 overflow-auto">
        <NuxtPage />
      </section>
    </div>
  </div>
</template>
