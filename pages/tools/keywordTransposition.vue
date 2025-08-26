<script lang="ts" setup>
import { useRoute } from '#imports'
import { useStorage } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import PageTitle from '~/components/PageTitle.vue'
import { useDefaults } from '~/composables/useDefaults'

// Sidebar: only SendTo is relevant here; others off
definePageMeta({
  controls: {
    input: false,
    find: false,
    highlights: false,
    orientation: false,
    print: false,
    sendTo: true,
    letterFrequency: false,
    selectionTracker: false,
    offset: false,
    diameter: false,
    wordStack: false,
  },
  urlState: {
    text: 'text',
    key: 'key',
    kt: { key: 'kt', type: 'string', default: 'keyword' },
    dual: { key: 'dual', type: 'bool', default: false },
    same: { key: 'same', type: 'bool', default: true },
    mode: { key: 'mode', type: 'string', default: 'decrypt' },
  },
})

const route = useRoute()
const { morseWordsInputs, morseWordsInputsWithE } = useDefaults()

// Inputs
const sourceText = ref('')
const keyMode = ref<'keyword' | 'numbers'>('keyword')
const dualGrid = ref(false)
const sameKeyBoth = ref(true)
const mode = ref<'encrypt' | 'decrypt'>('decrypt')
// User override for columns (0 = auto)
const overrideCols = ref<number>(0)
// Detect a fixed grid from input (multiline). If present, we respect its rows/cols.
const inputLines = computed(() => sourceText.value.split(/\r?\n/))
const nonEmptyLines = computed(() => inputLines.value.filter(l => l.length > 0))
const gridDetected = computed(() => nonEmptyLines.value.length > 1)
const detectedCols = computed(() => gridDetected.value ? Math.max(...nonEmptyLines.value.map(l => l.length)) : 0)
const detectedRows = computed(() => gridDetected.value ? nonEmptyLines.value.length : 0)

// Keys
const keywordL = ref('PALIMPSEST')
const keywordR = ref('PALIMPSEST')
const numbersRawL = ref('1 2 3 4')
const numbersRawR = ref('1 2 3 4')

onMounted(() => {
  if (typeof route.query.text === 'string')
    sourceText.value = decodeURIComponent(route.query.text)
  if (typeof route.query.key === 'string') { keywordL.value = String(route.query.key); keywordR.value = keywordL.value }
  if (typeof route.query.kt === 'string')
    keyMode.value = (String(route.query.kt) as any)
  if (typeof route.query.dual === 'string')
    dualGrid.value = route.query.dual === '1' || route.query.dual === 'true'
  if (typeof route.query.same === 'string')
    sameKeyBoth.value = route.query.same !== '0' && route.query.same !== 'false'
  if (typeof route.query.mode === 'string')
    mode.value = (route.query.mode === 'encrypt' ? 'encrypt' : 'decrypt')
})

const payloadText = useStorage('payload:text', '')
// If no ?text was provided, fall back to shared payload
watch(() => route.query.text, (t) => {
  if (!t && !sourceText.value && payloadText.value)
    sourceText.value = payloadText.value
}, { immediate: true })
// Button helper
function useSharedPayload() {
  if (payloadText.value)
    sourceText.value = payloadText.value
}

function loadMorse(withE: boolean) {
  sourceText.value = (withE ? morseWordsInputsWithE.value : morseWordsInputs.value).join('\n')
}
function clearText() { sourceText.value = '' }

// Helpers
// === Standard Columnar Transposition helpers (classic keyword scheme) ===
// Build a row-wise matrix from `text` for a given number of columns.
// Keeps blanks ("" in cells) for ragged last row, without padding.
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

// Read a matrix by columns in the provided key order (order elements are 1‑based src column ids)
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

// Given ciphertext produced by classic columnar transposition (rows filled left→right, columns read in key order),
// reconstruct the plaintext matrix by determining each column's height and filling column‑by‑column in key order.
function decryptToMatrix(cipher: string, cols: number, order: number[]): string[][] {
  const ct = cipher.replace(/\r?\n/g, '')
  if (!cols || !ct.length || !order.length)
    return []

  const rows = Math.ceil(ct.length / cols)
  const remainder = ct.length % cols

  // Column heights for physical columns 0..cols-1 (leftmost `remainder` columns are taller by 1 when ragged)
  const heights = Array.from({ length: cols }, (_, c) => (remainder === 0 || c >= remainder) ? rows - 1 : rows)
  if (remainder === 0)
    heights.fill(rows)

  // Allocate each slice of ciphertext to the appropriate physical column, iterating in key order
  const colsData: string[][] = Array.from({ length: cols }, () => [])
  let p = 0
  for (let i = 0; i < order.length; i++) {
    const physical = order[i] - 1
    const h = heights[physical] || 0
    const slice = ct.slice(p, p + h)
    p += h
    colsData[physical] = slice.split('')
  }

  // Rebuild the matrix row‑wise from the per‑column arrays
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

// Column counts
// Columns prefer override, then detected grid width if multiline input provided; else fall back to key length
const keyCols = computed(() => keyMode.value === 'keyword' ? keywordL.value.length : parseNumbers(numbersRawL.value).length)
const fullCols = computed(() => {
  if (overrideCols.value && overrideCols.value > 0)
    return overrideCols.value
  return gridDetected.value ? detectedCols.value : keyCols.value
})
const leftCols = computed(() => !dualGrid.value ? fullCols.value : Math.floor(fullCols.value / 2))
const rightCols = computed(() => !dualGrid.value ? 0 : (fullCols.value - leftCols.value))

const hasValidCols = computed(() => {
  if (!fullCols.value)
    return false
  if (!dualGrid.value)
    return true
  // dual: both halves must be > 0
  return leftCols.value > 0 && rightCols.value > 0
})

const disabledReason = computed(() => {
  if (hasValidCols.value)
    return ''
  if (!fullCols.value)
    return 'No columns detected (empty key or input).'
  if (dualGrid.value && (leftCols.value === 0 || rightCols.value === 0)) {
    return 'Dual grid split yields a zero-width half.'
  }
  return 'Invalid configuration.'
})

// Build full matrix row-wise with fullCols, then split by columns into L/R
const matrixFull = computed<string[][]>(() => {
  const cols = Math.max(0, fullCols.value)
  if (!cols)
    return []
  if (gridDetected.value) {
    // Build from lines; pad shorter lines to detectedCols with '' (keep original text untouched)
    return nonEmptyLines.value.map((line) => {
      const row = new Array(cols).fill('')
      for (let i = 0; i < Math.min(cols, line.length); i++) row[i] = line[i]
      return row
    })
  }
  // Single-line: fill row-wise by key column count
  const chars = sourceText.value.split('')
  const rows = Math.ceil(chars.length / cols)
  const m: string[][] = Array.from({ length: rows }, () => new Array(cols).fill(''))
  let k = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (k < chars.length)
        m[r][c] = chars[k++]
    }
  }
  return m
})

const matrixL = computed<string[][]>(() => {
  if (!dualGrid.value)
    return matrixFull.value
  const lc = leftCols.value
  return matrixFull.value.map(row => row.slice(0, lc))
})
const matrixR = computed<string[][]>(() => {
  if (!dualGrid.value)
    return []
  const lc = leftCols.value
  return matrixFull.value.map(row => row.slice(lc))
})

// Column labels
const columnLabelsFull = computed(() =>
  keyMode.value === 'numbers'
    ? parseNumbers(numbersRawL.value)
    : keywordL.value.toUpperCase().split(''),
)

const columnLabelsL = computed(() => {
  if (!dualGrid.value)
    return columnLabelsFull.value
  if (keyMode.value === 'numbers') {
    // If using separate right key, left uses numbersRawL as-is; otherwise slice the combined list
    const arr = sameKeyBoth.value ? parseNumbers(numbersRawL.value).slice(0, leftCols.value) : parseNumbers(numbersRawL.value)
    return arr.slice(0, leftCols.value)
  }
  else {
    const arr = sameKeyBoth.value ? keywordL.value.toUpperCase().split('').slice(0, leftCols.value) : keywordL.value.toUpperCase().split('')
    return arr.slice(0, leftCols.value)
  }
})

const columnLabelsR = computed(() => {
  if (!dualGrid.value)
    return []
  if (keyMode.value === 'numbers') {
    // If using separate right key, pull from numbersRawR; else slice the tail of left key
    const arr = sameKeyBoth.value ? parseNumbers(numbersRawL.value).slice(leftCols.value) : parseNumbers(numbersRawR.value)
    return arr.slice(0, rightCols.value)
  }
  else {
    const arr = sameKeyBoth.value ? keywordL.value.toUpperCase().split('').slice(leftCols.value) : keywordR.value.toUpperCase().split('')
    return arr.slice(0, rightCols.value)
  }
})

// Ensure label rows always render the same number of cells as the grid
function padLabels(labels: Array<string | number>, width: number): Array<string | number> {
  const out: Array<string | number> = Array.from({ length: Math.max(0, width) }, () => '')
  for (let i = 0; i < Math.min(labels.length, width); i++) out[i] = labels[i]
  return out
}

const columnLabelsFullPad = computed(() => padLabels(columnLabelsFull.value as Array<string | number>, fullCols.value))
const columnLabelsLPad = computed(() => padLabels(columnLabelsL.value as Array<string | number>, leftCols.value))
const columnLabelsRPad = computed(() => padLabels(columnLabelsR.value as Array<string | number>, rightCols.value))

// Orders
const orderFull = computed<number[]>(() => keyMode.value === 'numbers' ? parseNumbers(numbersRawL.value) : orderFromKeyword(keywordL.value))
const orderL = computed<number[]>(() => {
  if (!dualGrid.value)
    return orderFull.value
  const base = keyMode.value === 'numbers' ? parseNumbers(numbersRawL.value).slice(0, leftCols.value) : orderFromKeyword(keywordL.value.slice(0, leftCols.value))
  return base
})
const orderR = computed<number[]>(() => {
  if (!dualGrid.value)
    return []
  if (sameKeyBoth.value) {
    // reuse left key, but restricted to right width
    return keyMode.value === 'numbers' ? parseNumbers(numbersRawL.value).slice(leftCols.value) : orderFromKeyword(keywordL.value.slice(leftCols.value))
  }
  // separate right key
  return keyMode.value === 'numbers' ? parseNumbers(numbersRawR.value) : orderFromKeyword(keywordR.value)
})
// Apply row rules (cover / blank and reverse) to produce the working matrix
const matrixFullX = computed<string[][]>(() => {
  const base = matrixFull.value.map(row => row.slice())
  for (let r = 0; r < base.length; r++) {
    if (rowReverse.value[r])
      base[r] = base[r].slice().reverse()
    if (rowCover.value[r])
      base[r] = base[r].map(() => '')
  }
  return base
})
// Max rows from full matrix (after row rules)
const maxRows = computed(() => gridDetected.value ? detectedRows.value : matrixFullX.value.length)

// Row rules: cover (blank) and reverse per row
const rowCover = ref<boolean[]>([])
const rowReverse = ref<boolean[]>([])
const history = ref<{ type: 'cover' | 'reverse' | 'clear', r: number, prev?: { cover: boolean, reverse: boolean } }[]>([])

// ensure arrays sized to current rows
watch(() => maxRows.value, (n) => {
  // grow/shrink preserving existing flags
  if (n < rowCover.value.length) {
    rowCover.value = rowCover.value.slice(0, n)
    rowReverse.value = rowReverse.value.slice(0, n)
  }
  else if (n > rowCover.value.length) {
    rowCover.value = rowCover.value.concat(Array.from({ length: n - rowCover.value.length }).fill(false))
    rowReverse.value = rowReverse.value.concat(Array.from({ length: n - rowReverse.value.length }).fill(false))
  }
  else if (n === 0) {
    rowCover.value = []
    rowReverse.value = []
  }
}, { immediate: true })

function pushHistory(entry: { type: 'cover' | 'reverse' | 'clear', r: number, prev?: { cover: boolean, reverse: boolean } }) {
  history.value.push(entry)
}

function toggleCover(r: number) {
  rowCover.value[r] = !rowCover.value[r]
  pushHistory({ type: 'cover', r })
}
function toggleReverse(r: number) {
  rowReverse.value[r] = !rowReverse.value[r]
  pushHistory({ type: 'reverse', r })
}
function clearRowRule(r: number) {
  const prev = { cover: rowCover.value[r] || false, reverse: rowReverse.value[r] || false }
  if (prev.cover || prev.reverse)
    pushHistory({ type: 'clear', r, prev })
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
  rowCover.value = new Array(maxRows.value).fill(false)
  rowReverse.value = new Array(maxRows.value).fill(false)
  history.value = []
}

// Column getters
function columnAtFull(c: number): string[] { return matrixFullX.value.map(row => row?.[c] || '') }
function columnAtL(c: number): string[] { return matrixL.value.map(row => row?.[c] || '') }
function columnAtR(c: number): string[] { return matrixR.value.map(row => row?.[c] || '') }

// Validation: warn if key length(s) mismatch grid columns
const warnings = computed(() => {
  const w: string[] = []
  if (gridDetected.value) {
    const cols = fullCols.value
    if (!dualGrid.value) {
      const keyLen = (keyMode.value === 'numbers' ? parseNumbers(numbersRawL.value).length : keywordL.value.length)
      if (keyLen !== cols)
        w.push(`Key length (${keyLen}) does not match detected columns (${cols}).`)
    }
    else {
      const lCols = leftCols.value; const rCols = rightCols.value
      if (sameKeyBoth.value) {
        const parsedNums = keyMode.value === 'numbers' ? parseNumbers(numbersRawL.value) : []
        const kL = (keyMode.value === 'numbers' ? parsedNums.slice(0, lCols).length : Math.min(keywordL.value.length, lCols))
        const kR = (keyMode.value === 'numbers' ? parsedNums.slice(lCols).length : Math.max(0, Math.min(keywordL.value.length - lCols, rCols)))
        if (kL !== lCols)
          w.push(`Left key width (${kL}) != left columns (${lCols}).`)
        if (kR !== rCols)
          w.push(`Right key width (${kR}) != right columns (${rCols}).`)
      }
      else {
        const kL = (keyMode.value === 'numbers' ? parseNumbers(numbersRawL.value).length : keywordL.value.length)
        const kR = (keyMode.value === 'numbers' ? parseNumbers(numbersRawR.value).length : keywordR.value.length)
        if (kL !== lCols)
          w.push(`Left key length (${kL}) does not match left columns (${lCols}).`)
        if (kR !== rCols)
          w.push(`Right key length (${kR}) does not match right columns (${rCols}).`)
      }
    }
  }
  return w
})

// Output grid (reactive to current rules and order)
function reorderByOrder(matrix: string[][], order: number[]): string[][] {
  if (!matrix.length || !order.length)
    return []
  const out: string[][] = matrix.map(() => Array.from({ length: order.length }).fill(''))
  for (let r = 0; r < matrix.length; r++) {
    for (let i = 0; i < order.length; i++) {
      const srcC = (order[i] - 1)
      out[r][i] = matrix[r]?.[srcC] ?? ''
    }
  }
  return out
}
const outputMatrix = computed<string[][]>(() => {
  if (!hasValidCols.value)
    return []

  // When in classic DECRYPT mode and not using dual-grid, reconstruct plaintext from ciphertext.
  if (mode.value === 'decrypt' && !dualGrid.value) {
    const cols = fullCols.value
    const ord = orderFull.value
    return decryptToMatrix(sourceText.value, cols, ord)
  }

  // ENCRYPT (or dual-grid experimentation): show the working matrix after row rules
  return matrixFullX.value
})

const outputJoined = computed(() => {
  if (!outputMatrix.value.length)
    return ''
  if (mode.value === 'decrypt' && !dualGrid.value) {
    // Decrypt: join rows to get plaintext
    return outputMatrix.value.map(row => row.join('')).join('')
  }
  // Encrypt (classic): read columns by key order to get ciphertext
  const base = (gridDetected.value ? outputMatrix.value : buildRowWiseMatrix(sourceText.value, fullCols.value))
  const ord = orderFull.value
  return readColumnsByOrder(base, ord)
})

const outputText = ref('')

function runDecrypt() {
  outputText.value = outputJoined.value
}
function resetOutput() { outputText.value = '' }

function randPerm(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function randomizeOrder() {
  // Switch to numbers mode and fill with permutations that match current widths
  keyMode.value = 'numbers'
  const nL = dualGrid.value ? leftCols.value : fullCols.value
  numbersRawL.value = randPerm(nL).join(' ')
  if (dualGrid.value) {
    numbersRawR.value = randPerm(rightCols.value).join(' ')
  }
}

// Brute-force settings & state
const bfIterations = ref<number>(200)
const bfCols = ref<number>(0) // 0 = infer from scope
const bfFixedRaw = ref<string>('')
const bfScope = ref<'auto' | 'full' | 'left' | 'right'>('auto')

const DICT = ['BERLIN', 'SANBORN', 'CLOCK', 'ROTATE', 'CLUE', 'HINT', 'CODE', 'HOUR', 'MINUTES', 'DOT', 'EAST', 'NORTH', 'SOUTH', 'HOUR', 'FOLD', 'ROT', 'MONTANA', 'HELENA', 'LAST', 'BEST', 'PLACE']

interface BFResult {
  scope: 'full' | 'left' | 'right'
  order: number[]
  full: number
  partial: number
  fullHits: string[]
  partialHits: string[]
}
const bfResults = ref<BFResult[]>([])
const bfResultsSorted = computed(() => bfResults.value.slice().sort((a, b) => (b.full - a.full) || (b.partial - a.partial)))

// Interpret fixed input as a *block of column IDs* that must stay adjacent (in the typed order),
// and move together while other columns shuffle around them.
function parseFixedBlockValues(s: string, available: number[]): number[] {
  const want = s.split(/\D+/).map(t => t.trim()).filter(Boolean).map(Number)
  // Keep only entries that exist in available (by column ID), preserving the user-given order.
  const availSet = new Set(available)
  const block = want.filter(v => availSet.has(v))
  return Array.from(new Set(block)) // dedupe but preserve order
}

// Shuffle while keeping a contiguous block (by *column IDs*) fixed together.
function randPermWithFixedBlock(baseOrder: number[], blockVals: number[]): number[] {
  const n = baseOrder.length
  if (!blockVals.length) {
    // simple full shuffle
    const a = baseOrder.slice()
    for (let i = n - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]] }
    return a
  }
  const blockSet = new Set(blockVals)
  // Keep block values in the exact user-provided order (not the order in base)
  const block = blockVals.slice()
  // Others are everything in baseOrder that's not in the block
  const others = baseOrder.filter(v => !blockSet.has(v))
  // Shuffle the others
  for (let i = others.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [others[i], others[j]] = [others[j], others[i]] }
  // Choose an insertion index uniformly from 0..others.length so the block remains contiguous.
  const insertAt = Math.floor(Math.random() * (others.length + 1))
  const out = others.slice(0, insertAt).concat(block).concat(others.slice(insertAt))
  // Safety: ensure it's a permutation of baseOrder
  if (out.length !== n)
    return baseOrder.slice()
  return out
}

function collectLines(matrix: string[][]): string[] {
  const R = matrix.length; const C = matrix[0]?.length || 0
  const lines: string[] = []
  // rows
  for (let r = 0; r < R; r++) lines.push(matrix[r].join(''))
  // cols
  for (let c = 0; c < C; c++) { const col: string[] = []; for (let r = 0; r < R; r++) col.push(matrix[r][c] || ''); lines.push(col.join('')) }
  // diag down-right
  for (let k = -(R - 1); k <= C - 1; k++) {
    const diag: string[] = []
    for (let r = 0; r < R; r++) {
      const c = r + k; if (c >= 0 && c < C)
        diag.push(matrix[r][c] || '')
    }
    if (diag.length)
      lines.push(diag.join(''))
  }
  // diag up-right
  for (let k = 0; k < R + C - 1; k++) {
    const diag: string[] = []
    for (let r = 0; r < R; r++) {
      const c = k - r; if (c >= 0 && c < C)
        diag.push(matrix[r][c] || '')
    }
    if (diag.length)
      lines.push(diag.join(''))
  }
  return lines.map(s => s.toUpperCase())
}

function scoreDict(matrix: string[][]) {
  const lines = collectLines(matrix)
  let full = 0; let partial = 0
  const fullSet = new Set<string>()
  const partSet = new Set<string>()

  for (const word of DICT) {
    const w = word.toUpperCase()
    const prefixes: string[] = []
    for (let k = 3; k < w.length; k++) prefixes.push(w.slice(0, k))
    for (const L of lines) {
      // full matches
      const reFull = new RegExp(w, 'g')
      const mFull = L.match(reFull)
      if (mFull) { full += mFull.length; fullSet.add(w) }
      // partial prefixes (≥3)
      for (const p of prefixes) {
        const reP = new RegExp(p, 'g')
        const mP = L.match(reP)
        if (mP) { partial += mP.length; partSet.add(p) }
      }
    }
  }

  // Sort to show most informative hits first
  const fullHits = Array.from(fullSet).sort((a, b) => b.length - a.length || a.localeCompare(b))
  const partialHits = Array.from(partSet).sort((a, b) => b.length - a.length || a.localeCompare(b))
  return { full, partial, fullHits, partialHits }
}

function matrixForOrder(order: number[], scope: 'full' | 'left' | 'right'): string[][] {
  if (mode.value === 'decrypt' && !dualGrid.value) {
    const cols = (scope === 'full') ? fullCols.value : (scope === 'left' ? leftCols.value : rightCols.value)
    return decryptToMatrix(sourceText.value, cols, order)
  }
  // Fallback to simple column reordering visualization for non-standard/dual-grid cases
  const base = matrixFullX.value
  if (scope === 'full')
    return reorderByOrder(base, order)
  const lc = leftCols.value
  const left = base.map(row => row.slice(0, lc))
  const right = base.map(row => row.slice(lc))
  if (scope === 'left') {
    const L = reorderByOrder(left, order)
    return L.map((row, r) => row.concat(right[r] || []))
  }
  else {
    const R = reorderByOrder(right, order)
    return left.map((row, r) => row.concat(R[r] || []))
  }
}

function runBruteForce() {
  // Decide scope
  const scope: 'full' | 'left' | 'right' = (bfScope.value === 'auto')
    ? (dualGrid.value ? 'left' : 'full')
    : (bfScope.value as any)

  // Base order from current UI state (used if no explicit bfCols)
  const baseOrder = (scope === 'full')
    ? orderFull.value.slice()
    : (scope === 'left')
        ? orderL.value.slice()
        : orderR.value.slice()

  // Determine working column count `n` and starting order
  const n = bfCols.value && bfCols.value > 0 ? bfCols.value : baseOrder.length
  // If user specified bfCols, start from identity [1..n];
  // otherwise use the current base order length.
  const startOrder = (bfCols.value && bfCols.value > 0)
    ? Array.from({ length: n }, (_, i) => i + 1)
    : baseOrder.slice()

  if (!n || startOrder.length !== n) {
    // If we somehow cannot build the starting order for the requested n, bail safely
    return
  }

  // Parse a contiguous *block* of column IDs that should stay together in the given order.
  const fixedBlock = parseFixedBlockValues(bfFixedRaw.value, startOrder)

  const localResults: BFResult[] = []
  const iters = Math.max(1, (bfIterations.value | 0))
  for (let i = 0; i < iters; i++) {
    // Randomize but keep the block together; block can slide anywhere as a unit
    const order = randPermWithFixedBlock(startOrder, fixedBlock)

    // Build matrix for this order & score
    const m = matrixForOrder(order, scope)
    const { full, partial, fullHits, partialHits } = scoreDict(m)
    localResults.push({ scope, order, full, partial, fullHits, partialHits })
  }

  // Append and let the computed sorter handle ranking
  bfResults.value = bfResults.value.concat(localResults)
}

function applyBrute(r: BFResult) {
  keyMode.value = 'numbers'
  if (r.scope === 'full') {
    numbersRawL.value = r.order.join(' ')
  }
  else if (r.scope === 'left') {
    numbersRawL.value = r.order.join(' ')
  }
  else {
    numbersRawR.value = r.order.join(' ')
  }
}

function clearBrute() { bfResults.value = [] }
</script>

<template>
  <div class="min-h-full px-4 py-6">
    <PageTitle class="uppercase" title="Keyword Transposition" size="lg" :display="true">
      <template #subtitle>
        Columnar transposition • dual-grid option • keyword or numeric keys • non‑destructive until Decrypt
      </template>
    </PageTitle>

    <!-- Inputs -->
    <section class="grid gap-4 mt-4 xl:grid-cols-3">
      <!-- Text + presets -->
      <div class="xl:col-span-1">
        <label class="block mb-1 text-sm font-medium">Source Text</label>
        <textarea v-model="sourceText" rows="10" class="w-full p-2 font-mono text-black border"></textarea>
        <div class="flex flex-wrap gap-2 mt-2 text-xs">
          <button class="px-2 py-1 border rounded" @click="loadMorse(false)">
            Load Morse (plain)
          </button>
          <button class="px-2 py-1 border rounded" @click="loadMorse(true)">
            Load Morse (with E's)
          </button>
          <button class="px-2 py-1 border rounded" @click="clearText">
            Clear
          </button>
          <button class="px-2 py-1 border rounded" @click="useSharedPayload">
            Use Shared Selection
          </button>
        </div>
        <p class="mt-1 text-xs opacity-70">
          Tip: You can also pass text via <code>?text=...</code> from
          Copperplate/Morse.
        </p>
      </div>

      <!-- Key controls (global + dual-grid) -->
      <div class="xl:col-span-2">
        <div class="flex flex-wrap items-center gap-4">
          <label class="inline-flex items-center gap-2 text-sm">
            <input v-model="dualGrid" type="checkbox" />
            <span>Dual Grid (split columns left/right)</span>
          </label>
          <label v-if="dualGrid" class="inline-flex items-center gap-2 text-sm">
            <input v-model="sameKeyBoth" type="checkbox" />
            <span>Use same key for both halves</span>
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-4 mt-3">
          <label class="inline-flex items-center gap-2 text-sm">
            <span>Override Columns</span>
            <input
              v-model.number="overrideCols" type="number" min="1"
              class="w-24 px-2 py-1 text-black border rounded"
            />
          </label>
          <button class="px-2 py-1 text-xs border rounded" @click="randomizeOrder">
            Randomize Order
          </button>
        </div>

        <!-- Key mode selector (always global for simplicity) -->
        <div class="flex items-center gap-4 mt-3">
          <label class="inline-flex items-center gap-2 text-sm">
            <input v-model="keyMode" type="radio" value="keyword" />
            <span>Keyword</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm">
            <input v-model="keyMode" type="radio" value="numbers" />
            <span>Numbers</span>
          </label>
        </div>
        <div class="flex items-center gap-4 mt-3">
          <label class="inline-flex items-center gap-2 text-sm">
            <input v-model="mode" type="radio" value="decrypt" />
            <span>Mode: Decrypt (classic)</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm">
            <input v-model="mode" type="radio" value="encrypt" />
            <span>Mode: Encrypt</span>
          </label>
        </div>

        <!-- Keys: single or per-grid -->
        <div class="grid gap-3 mt-3 md:grid-cols-2" :class="{ 'md:grid-cols-1': !dualGrid || sameKeyBoth }">
          <!-- Left / single key -->
          <div>
            <div v-if="keyMode === 'keyword'">
              <label class="block mb-1 text-sm font-medium">Keyword (Left / Single)</label>
              <input
                v-model="keywordL" type="text" class="w-full px-2 py-1 text-black border"
                placeholder="e.g. PALIMPSEST"
              />
              <p class="mt-1 text-xs opacity-70">
                Letters map to numeric rank (a=1 … z=26); ties keep left‑to‑right.
              </p>
            </div>
            <div v-else>
              <label class="block mb-1 text-sm font-medium">Numbers (Left / Single)</label>
              <input
                v-model="numbersRawL" type="text" class="w-full px-2 py-1 text-black border"
                placeholder="e.g. 3 1 4 2 5"
              />
              <p class="mt-1 text-xs opacity-70">
                Space/comma‑separated column order.
              </p>
            </div>
          </div>

          <!-- Right key (only when dualGrid && !sameKeyBoth) -->
          <div v-if="dualGrid && !sameKeyBoth">
            <div v-if="keyMode === 'keyword'">
              <label class="block mb-1 text-sm font-medium">Keyword (Right)</label>
              <input
                v-model="keywordR" type="text" class="w-full px-2 py-1 text-black border"
                placeholder="e.g. PALIMPSEST"
              />
            </div>
            <div v-else>
              <label class="block mb-1 text-sm font-medium">Numbers (Right)</label>
              <input
                v-model="numbersRawR" type="text" class="w-full px-2 py-1 text-black border"
                placeholder="e.g. 3 1 4 2 5"
              />
            </div>
          </div>
        </div>

        <div class="mt-4">
          <button
            class="px-3 py-1 rounded bg-primary hover:brightness-110" :disabled="!hasValidCols"
            @click="runDecrypt"
          >
            Run
          </button>
          <button class="px-3 py-1 ml-2 border rounded" :disabled="!outputText" @click="resetOutput">
            Reset
          </button>
        </div>
        <p v-if="!hasValidCols && disabledReason" class="mt-1 text-xs text-red-600">
          {{ disabledReason }}
        </p>
        <div
          v-if="warnings.length"
          class="p-2 mt-3 text-sm text-yellow-900 border border-yellow-300 rounded bg-yellow-50"
        >
          <div class="font-semibold">
            Warnings
          </div>
          <ul class="ml-5 list-disc">
            <li v-for="(w, i) in warnings" :key="i">
              {{ w }}
            </li>
          </ul>
        </div>

        <div class="grid gap-2 mt-3 text-sm md:grid-cols-2">
          <div>Full columns: <strong>{{ fullCols }}</strong></div>
          <div v-if="dualGrid">
            Left/Right columns: <strong>{{ leftCols }}</strong> / <strong>{{ rightCols }}</strong>
          </div>
          <div>
            Rows: <strong>{{ maxRows }}</strong> <span v-if="gridDetected" class="opacity-70">(from input)</span>
          </div>
          <div v-if="!dualGrid">
            Key order: <code>{{ orderFull.join(', ') }}</code>
          </div>
          <div v-else>
            <div>Key order (L): <code>{{ orderL.join(', ') }}</code></div>
            <div>Key order (R): <code>{{ orderR.join(', ') }}</code></div>
          </div>
        </div>
      </div>
    </section>
    <!-- Row Rules -->
    <section class="mt-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">
          Row Rules
        </h3>
        <div class="flex gap-2">
          <button class="px-2 py-1 text-xs border rounded" :disabled="!history.length" @click="undoLastRule">
            Undo
            Last
          </button>
          <button
            class="px-2 py-1 text-xs border rounded" :disabled="!rowCover.length && !rowReverse.length"
            @click="resetRules"
          >
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
            <tr v-for="r in maxRows" :key="`rr-${r}`">
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
                    {{ rowCover[r - 1]
                      ? 'Uncover' : 'Cover' }}
                  </button>
                  <button class="px-2 py-0.5 text-xs border rounded" @click="toggleReverse(r - 1)">
                    {{ rowReverse[r - 1]
                      ? 'Unreverse' : 'Reverse' }}
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
    </section>

    <!-- Preview Panels -->
    <section class="grid gap-4 mt-6" :class="dualGrid ? 'md:grid-cols-2' : 'md:grid-cols-2'">
      <!-- Left or single preview -->
      <div>
        <h3 class="mb-1 font-semibold">
          Matrix Preview — {{ dualGrid ? 'Left Half' : 'Full' }}
        </h3>
        <div class="overflow-auto border">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th
                  v-for="c in (dualGrid ? leftCols : fullCols)" :key="`hL-${c}`"
                  class="px-2 py-1 text-center border-b"
                >
                  {{ c }}
                </th>
              </tr>
              <tr>
                <th
                  v-for="(lbl, idx) in (dualGrid ? columnLabelsLPad : columnLabelsFullPad)" :key="`kL-${idx}`"
                  class="px-2 py-1 text-center text-white border-b bg-zinc-900"
                >
                  {{ lbl }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, r) in (dualGrid ? matrixL : matrixFull)" :key="`rL-${r}`">
                <td v-for="(cell, c) in row" :key="`rL-${r}-c-${c}`" class="px-2 py-1 text-center border-b">
                  {{ cell
                    || '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right preview (only in dual) -->
      <div v-if="dualGrid">
        <h3 class="mb-1 font-semibold">
          Matrix Preview — Right Half
        </h3>
        <div class="overflow-auto border">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th v-for="c in rightCols" :key="`hR-${c}`" class="px-2 py-1 text-center border-b">
                  {{ c }}
                </th>
              </tr>
              <tr>
                <th
                  v-for="(lbl, idx) in columnLabelsRPad" :key="`kR-${idx}`"
                  class="px-2 py-1 text-center text-white border-b bg-zinc-900"
                >
                  {{ lbl }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, r) in matrixR" :key="`rR-${r}`">
                <td v-for="(cell, c) in row" :key="`rR-${r}-c-${c}`" class="px-2 py-1 text-center border-b">
                  {{ cell
                    || '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Reordered Columns Preview -->
    <section v-if="dualGrid" class="grid gap-4 mt-6 md:grid-cols-2">
      <div>
        <h3 class="mb-1 font-semibold">
          Reordered Columns — Left
        </h3>
        <div class="overflow-auto border">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th v-for="(c, i) in orderL" :key="`ohL-${i}`" class="px-2 py-1 text-center border-b">
                  {{ c }}
                </th>
              </tr>
              <tr>
                <th
                  v-for="(lbl, idx) in columnLabelsLPad" :key="`kRL-${idx}`"
                  class="px-2 py-1 text-center text-white border-b bg-zinc-900"
                >
                  {{ lbl }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in maxRows" :key="`orL-${r}`">
                <td v-for="(colIndex, i) in orderL" :key="`orL-${r}-${i}`" class="px-2 py-1 text-center border-b">
                  {{ columnAtL(colIndex - 1)[r - 1] || '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 class="mb-1 font-semibold">
          Reordered Columns — Right
        </h3>
        <div class="overflow-auto border">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th v-for="(c, i) in orderR" :key="`ohR-${i}`" class="px-2 py-1 text-center border-b">
                  {{ c }}
                </th>
              </tr>
              <tr>
                <th
                  v-for="(lbl, idx) in columnLabelsRPad" :key="`kRR-${idx}`"
                  class="px-2 py-1 text-center text-white border-b bg-zinc-900"
                >
                  {{ lbl }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in maxRows" :key="`orR-${r}`">
                <td v-for="(colIndex, i) in orderR" :key="`orR-${r}-${i}`" class="px-2 py-1 text-center border-b">
                  {{ columnAtR(colIndex - 1)[r - 1] || '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Brute Force (lightweight) -->
    <section class="mt-8">
      <h3 class="mb-2 font-semibold">
        Brute Force (lightweight)
      </h3>
      <div class="flex flex-wrap items-end gap-4">
        <label class="inline-flex items-center gap-2 text-sm">
          <span>Iterations</span>
          <input v-model.number="bfIterations" type="number" min="1" class="w-24 px-2 py-1 text-black border rounded" />
        </label>
        <label class="inline-flex items-center gap-2 text-sm">
          <span>Columns</span>
          <input v-model.number="bfCols" type="number" min="1" class="w-24 px-2 py-1 text-black border rounded" />
        </label>
        <label class="inline-flex items-center gap-2 text-sm">
          <span>Fixed positions</span>
          <input
            v-model="bfFixedRaw" type="text" placeholder="e.g. 1,5,14"
            class="px-2 py-1 text-black border rounded w-52"
          />
        </label>
        <div class="inline-flex items-center gap-2 text-sm">
          <span>Scope</span>
          <label class="inline-flex items-center gap-1"><input v-model="bfScope" type="radio" value="auto" />
            <span>Auto</span></label>
          <label class="inline-flex items-center gap-1"><input v-model="bfScope" type="radio" value="full" />
            <span>Full</span></label>
          <label class="inline-flex items-center gap-1"><input v-model="bfScope" type="radio" value="left" />
            <span>L</span></label>
          <label class="inline-flex items-center gap-1"><input
            v-model="bfScope" type="radio" value="right"
            :disabled="!dualGrid"
          /> <span>R</span></label>
        </div>
        <button class="px-3 py-1 rounded bg-primary hover:brightness-110" @click="runBruteForce">
          Run
        </button>
        <button class="px-3 py-1 border rounded" @click="clearBrute">
          Clear Results
        </button>
      </div>
      <p class="mt-2 text-xs opacity-70">
        Dictionary: {{ DICT.join(', ') }} — finds full matches and prefix matches (≥3
        chars) across 8 directions.
      </p>

      <div v-if="bfResults.length" class="mt-3 overflow-auto border max-h-72">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="px-2 py-1 text-left border-b">
                #
              </th>
              <th class="px-2 py-1 text-left border-b">
                Scope
              </th>
              <th class="px-2 py-1 text-left border-b">
                Order
              </th>
              <th class="px-2 py-1 text-left border-b">
                Full Hits
              </th>
              <th class="px-2 py-1 text-left border-b">
                Full Words
              </th>
              <th class="px-2 py-1 text-left border-b">
                Partial Hits
              </th>
              <th class="px-2 py-1 text-left border-b">
                Partial (≥3)
              </th>
              <th class="px-2 py-1 text-left border-b">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in bfResultsSorted" :key="`bfr-${i}`">
              <td class="px-2 py-1 border-b">
                {{ i + 1 }}
              </td>
              <td class="px-2 py-1 border-b">
                {{ r.scope }}
              </td>
              <td class="px-2 py-1 font-mono border-b">
                {{ r.order.join(' ') }}
              </td>
              <td class="px-2 py-1 border-b">
                {{ r.full }}
              </td>
              <td class="px-2 py-1 border-b truncate max-w-[18rem]" :title="r.fullHits.join(', ')">
                {{ r.fullHits.join(',') }}
              </td>
              <td class="px-2 py-1 border-b">
                {{ r.partial }}
              </td>
              <td class="px-2 py-1 border-b truncate max-w-[18rem]" :title="r.partialHits.join(', ')">
                {{
                  r.partialHits.join(', ') }}
              </td>
              <td class="px-2 py-1 border-b">
                <button class="px-2 py-0.5 text-xs border rounded" @click="applyBrute(r)">
                  Apply
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Output -->
    <section class="mt-6">
      <h3 class="mb-1 font-semibold">
        Output (live)
      </h3>
      <div class="overflow-auto border">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th v-for="c in (dualGrid ? fullCols : fullCols)" :key="`oh-${c}`" class="px-0 py-1 text-center border-b">
                {{ c }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, r) in outputMatrix" :key="`out-r-${r}`">
              <td v-for="(cell, c) in row" :key="`out-r-${r}-c-${c}`" class="px-0 py-1 text-center border-b">
                {{ cell
                  || '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <label class="block mt-3 mb-1 text-sm font-medium">
        Output (joined — {{ mode === 'decrypt' ? 'rows/plaintext' : 'cols/ciphertext' }})
      </label>
      <textarea :value="outputJoined" rows="6" class="w-full p-2 font-mono text-black border" readonly></textarea>
    </section>
  </div>
</template>

<style scoped>
:root { --primary: #16a34a; }
.bg-primary { background-color: var(--primary); }
</style>
