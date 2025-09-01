<script lang="ts" setup>
// This wrapper component encapsulates the logic of the keyword
// transposition cipher and uses the KeywordTranspositionDisplay
// presentation component to render the matrices and output.  It
// accepts an `inputText` prop from its parent, allowing pages to
// provide the source text from global state.  Users can modify the
// keyword, switch between encrypt and decrypt modes, and toggle
// optional row rules (cover and reverse).  The full functionality of
// the original page has been condensed for clarity; advanced features
// such as dual grids, numeric keys and brute force remain to be
// implemented as needed.

import { computed, ref, watch, watchEffect } from 'vue'
import KeywordTranspositionDisplay from './keywordTranspositionDisplay.vue'

// Props: source text to operate on
const props = withDefaults(defineProps<{ inputText: string }>(), { inputText: '' })

// Emit the transformed output so it can be chained to other tools
const emit = defineEmits<{ (e: 'update:output', v: string): void }>()

// Reactive state
const sourceText = ref(props.inputText)
// Update sourceText when prop changes; do not overwrite user edits
watch(() => props.inputText, (v) => {
  if (typeof v === 'string' && !sourceText.value)
    sourceText.value = v
})

// Keyword settings
const keyMode = ref<'keyword' | 'numbers'>('keyword')
const keyword = ref('PALIMPSEST')
const mode = ref<'encrypt' | 'decrypt'>('decrypt')

// Row rule state: per‑row cover and reverse flags
const rowCover = ref<boolean[]>([])
const rowReverse = ref<boolean[]>([])
const history = ref<{ type: 'cover' | 'reverse' | 'clear', r: number, prev?: { cover: boolean, reverse: boolean } }[]>([])

// Build a row‑wise matrix from `text` for a given number of columns.  Keeps
// blanks for ragged last rows without padding.
function buildRowWiseMatrix(text: string, cols: number): string[][] {
  const clean = text.replace(/\r?\n/g, '')
  if (!cols || !clean.length)
    return []
  const rows = Math.ceil(clean.length / cols)
  const m: string[][] = Array.from({ length: rows }, () => new Array(cols).fill(''))
  let k = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (k < clean.length)
        m[r][c] = clean[k++]
    }
  }
  return m
}

// Read a matrix by columns according to a 1‑based order array
function readColumnsByOrder(matrix: string[][], order: number[]): string {
  if (!matrix.length || !order.length)
    return ''
  const rows = matrix.length
  let out = ''
  for (let i = 0; i < order.length; i++) {
    const c = order[i] - 1
    for (let r = 0; r < rows; r++) out += matrix[r]?.[c] || ''
  }
  return out
}

// Reconstruct the plaintext matrix from ciphertext by column heights
function decryptToMatrix(cipher: string, cols: number, order: number[]): string[][] {
  const ct = cipher.replace(/\r?\n/g, '')
  if (!cols || !ct.length || !order.length)
    return []
  const rows = Math.ceil(ct.length / cols)
  const remainder = ct.length % cols
  const heights = Array.from({ length: cols }, (_, c) => (remainder === 0 || c >= remainder) ? rows - 1 : rows)
  if (remainder === 0)
    heights.fill(rows)
  const colsData: string[][] = Array.from({ length: cols }, () => [])
  let p = 0
  for (let i = 0; i < order.length; i++) {
    const physical = order[i] - 1
    const h = heights[physical] || 0
    const slice = ct.slice(p, p + h)
    p += h
    colsData[physical] = slice.split('')
  }
  const m: string[][] = Array.from({ length: rows }, () => new Array(cols).fill(''))
  for (let c = 0; c < cols; c++) {
    const col = colsData[c]
    for (let r = 0; r < (col?.length || 0); r++) m[r][c] = col[r]
  }
  return m
}

function parseNumbers(s: string): number[] {
  return s.split(/\D+/).map(t => t.trim()).filter(Boolean).map(n => Number(n)).filter(n => Number.isFinite(n) && n > 0)
}
function orderFromKeyword(word: string): number[] {
  const chars = word.split('').map((ch, i) => ({ ch: ch.toLowerCase(), i }))
  const sorted = chars.slice().sort((a, b) => a.ch === b.ch ? a.i - b.i : (a.ch < b.ch ? -1 : 1))
  return sorted.map(x => x.i + 1)
}

// Columns: default to keyword length
const cols = computed(() => {
  return keyMode.value === 'keyword' ? keyword.value.length : parseNumbers(keyword.value).length
})

// Ensure rowCover and rowReverse match current rows
const matrixBase = computed(() => buildRowWiseMatrix(sourceText.value, cols.value))
const rowsCount = computed(() => matrixBase.value.length)
watch(rowsCount, (n) => {
  if (n < rowCover.value.length) {
    rowCover.value = rowCover.value.slice(0, n)
    rowReverse.value = rowReverse.value.slice(0, n)
  }
  else if (n > rowCover.value.length) {
    rowCover.value = rowCover.value.concat(Array.from({ length: n - rowCover.value.length }).fill(false))
    rowReverse.value = rowReverse.value.concat(Array.from({ length: n - rowReverse.value.length }).fill(false))
  }
}, { immediate: true })

// Apply row rules to the base matrix
const matrixFullX = computed(() => {
  const base = matrixBase.value.map(row => row.slice())
  for (let r = 0; r < base.length; r++) {
    if (rowReverse.value[r])
      base[r] = base[r].slice().reverse()
    if (rowCover.value[r])
      base[r] = base[r].map(() => '')
  }
  return base
})

// Compute the key order
const order = computed(() => {
  return keyMode.value === 'keyword' ? orderFromKeyword(keyword.value) : parseNumbers(keyword.value)
})

// Column labels: uppercase characters of the keyword or numeric keys.  For
// simplicity this wrapper supports only single grids; dual grids and
// separate left/right keys are beyond this basic implementation.
const columnLabelsFullPad = computed(() => {
  if (keyMode.value === 'keyword')
    return keyword.value.toUpperCase().split('')
  return parseNumbers(keyword.value).map(n => String(n))
})

// Output matrix and joined string based on mode
const outputMatrix = computed(() => {
  if (mode.value === 'decrypt') {
    // decrypt: reorder columns by order to get plaintext
    const base = matrixFullX.value
    const ord = order.value
    return decryptToMatrix(readColumnsByOrder(base, ord), cols.value, ord)
  }
  else {
    // encrypt: read columns by order to get ciphertext matrix
    const base = matrixFullX.value
    return base
  }
})
const outputJoined = computed(() => {
  if (mode.value === 'decrypt') {
    // read row by row for decrypt output
    return outputMatrix.value.flat().join('')
  }
  else {
    // encrypt: read columns by order
    const ord = order.value
    return readColumnsByOrder(matrixFullX.value, ord)
  }
})

// Emit the output joined string for chaining
watchEffect(() => emit('update:output', outputJoined.value))

// Row rule toggle handlers
function toggleCover(r: number) {
  rowCover.value[r] = !rowCover.value[r]
  history.value.push({ type: 'cover', r })
}
function toggleReverse(r: number) {
  rowReverse.value[r] = !rowReverse.value[r]
  history.value.push({ type: 'reverse', r })
}
function clearRowRule(r: number) {
  const prev = { cover: rowCover.value[r] || false, reverse: rowReverse.value[r] || false }
  if (prev.cover || prev.reverse)
    history.value.push({ type: 'clear', r, prev })
  rowCover.value[r] = false
  rowReverse.value[r] = false
}
function undoLastRule() {
  const last = history.value.pop()
  if (!last)
    return
  const r = last.r
  if (last.type === 'cover') {
    rowCover.value[r] = !rowCover.value[r]
  }
  else if (last.type === 'reverse') {
    rowReverse.value[r] = !rowReverse.value[r]
  }
  else if (last.type === 'clear' && last.prev) {
    rowCover.value[r] = last.prev.cover
    rowReverse.value[r] = last.prev.reverse
  }
}
function resetRules() {
  rowCover.value = new Array(rowsCount.value).fill(false)
  rowReverse.value = new Array(rowsCount.value).fill(false)
  history.value = []
}
</script>

<template>
  <div class="min-h-full px-4 py-6">
    <h2 class="mb-4 text-2xl font-bold">
      Keyword Transposition
    </h2>

    <!-- Source text input -->
    <div class="mb-4">
      <label class="block mb-1 text-sm font-medium">Source Text</label>
      <textarea v-model="sourceText" rows="6" class="w-full p-2 font-mono text-black border"></textarea>
    </div>

    <!-- Key controls -->
    <div class="flex flex-wrap items-center gap-4 mb-4">
      <label class="inline-flex items-center gap-2 text-sm">
        <input v-model="keyMode" type="radio" value="keyword" />
        <span>Keyword</span>
      </label>
      <label class="inline-flex items-center gap-2 text-sm">
        <input v-model="keyMode" type="radio" value="numbers" />
        <span>Numbers</span>
      </label>
      <label class="inline-flex items-center gap-2 text-sm">
        <input v-model="mode" type="radio" value="decrypt" />
        <span>Decrypt</span>
      </label>
      <label class="inline-flex items-center gap-2 text-sm">
        <input v-model="mode" type="radio" value="encrypt" />
        <span>Encrypt</span>
      </label>
    </div>
    <div class="mb-4">
      <label class="block mb-1 text-sm font-medium">{{ keyMode === 'keyword' ? 'Keyword' : 'Numbers' }}</label>
      <input v-model="keyword" type="text" class="w-full px-2 py-1 text-black border" />
    </div>

    <!-- Row rules table -->
    <div class="mt-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">
          Row Rules
        </h3>
        <div class="flex gap-2">
          <button class="px-2 py-1 text-xs border rounded" :disabled="!history.length" @click="undoLastRule">
            Undo
            Last
          </button>
          <button class="px-2 py-1 text-xs border rounded" @click="resetRules">
            Reset
          </button>
        </div>
      </div>
      <div class="overflow-auto border max-h-60">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="px-2 py-1 text-left border-b">
                Row
              </th>
              <th class="px-2 py-1 text-left border-b">
                Status
              </th>
              <th class="px-2 py-1 text-left border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rowsCount" :key="`rr-${r}`">
              <td class="px-2 py-1 border-b">
                {{ r }}
              </td>
              <td class="px-2 py-1 border-b">
                <span v-if="rowCover[r - 1]" class="px-1 mr-1 text-xs border rounded">covered</span>
                <span v-if="rowReverse[r - 1]" class="px-1 text-xs border rounded">reversed</span>
                <span v-if="!rowCover[r - 1] && !rowReverse[r - 1]" class="text-xs opacity-60">none</span>
              </td>
              <td class="px-2 py-1 border-b">
                <div class="flex flex-wrap gap-2">
                  <button class="px-2 py-0.5 text-xs border rounded" @click="toggleCover(r - 1)">
                    {{ rowCover[r - 1] ? 'Uncover' : 'Cover' }}
                  </button>
                  <button class="px-2 py-0.5 text-xs border rounded" @click="toggleReverse(r - 1)">
                    {{ rowReverse[r - 1] ? 'Unreverse' : 'Reverse' }}
                  </button>
                  <button
                    class="px-2 py-0.5 text-xs border rounded" :disabled="!rowCover[r - 1] && !rowReverse[r - 1]"
                    @click="clearRowRule(r - 1)"
                  >
                    Clear
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Matrix and output display -->
    <KeywordTranspositionDisplay
      :dual-grid="false" :matrix-full="matrixFullX" :matrix-l="[]" :matrix-r="[]"
      :column-labels-full-pad="columnLabelsFullPad" :column-labels-l-pad="[]" :column-labels-r-pad="[]"
      :order-full="order" :order-l="[]" :order-r="[]" :left-cols="cols" :right-cols="0" :full-cols="cols"
      :max-rows="rowsCount" :output-matrix="outputMatrix" :output-joined="outputJoined" :mode="mode"
    />
  </div>
</template>

<style scoped></style>
