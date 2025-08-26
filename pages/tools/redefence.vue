<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const sharedPayload = useStorage<string>('payload:text', '')
const localText = ref('')
const useShared = ref(true)
const cleanedInput = computed(() => (useShared.value ? sharedPayload.value : localText.value) || '')

const keepNonLetters = ref(false)
const reverseInput = ref(false)
function maybeReverse(s: string) {
  return reverseInput.value ? s.split('').reverse().join('') : s
}
const rails = ref(3)
const key = ref('')
const maxRails = ref(8)
const maxCandidates = ref(2000)
const keyedOffset = ref(0)

function normalizeInput(s: string) {
  if (keepNonLetters.value)
    return s
  return (s.match(/[A-Z]/gi) || []).join('')
}

function pathFor(len: number, r: number) {
  const seq: number[] = []
  let rail = 0
  let dir = 1
  for (let i = 0; i < len; i++) {
    seq.push(rail)
    rail += dir
    if (rail === r - 1 || rail === 0)
      dir *= -1
  }
  return seq
}

function keyOrder(k: string, r: number) {
  if (!k)
    return Array.from({ length: r }, (_, i) => i)
  const items = k.split('').map((ch, idx) => ({ ch: ch.toLowerCase(), idx }))
  items.sort((a, b) => (a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : a.idx - b.idx))
  const order = items.map(it => it.idx).slice(0, r)
  const seen = new Set<number>()
  const uniq = order.filter((i) => {
    if (seen.has(i))
      return false
    seen.add(i)
    return true
  })
  while (uniq.length < r) uniq.push(uniq.length)
  return uniq
}

function countsPerRail(seq: number[], r: number) {
  const counts = new Array(r).fill(0)
  for (const v of seq) counts[v]++
  return counts
}

function decryptWithOrder(ct: string, r: number, order: number[], off: number = 0) {
  const s = normalizeInput(ct)
  if (r < 2 || s.length === 0)
    return ''
  const seq = pathFor(s.length, r)
  let seqUsed = seq
  if (off) {
    const L = seq.length
    const k = ((off % L) + L) % L
    if (k)
      seqUsed = Array.from({ length: L }, (_, i) => seq[(i + k) % L])
  }
  const counts = countsPerRail(seqUsed, r)
  const rowSlices: string[] = []
  let pos = 0
  for (let j = 0; j < r; j++) {
    const rowIndex = order[j]
    const take = counts[rowIndex]
    rowSlices[rowIndex] = s.slice(pos, pos + take)
    pos += take
  }
  const rowPtrs = new Array(r).fill(0)
  const out: string[] = []
  for (let i = 0; i < s.length; i++) {
    const rr = seqUsed[i]
    out.push(rowSlices[rr][rowPtrs[rr]++])
  }
  let plain = out.join('')
  if (keepNonLetters.value) {
    let pIdx = 0
    const merged: string[] = []
    for (let i = 0; i < ct.length; i++) {
      const ch = ct[i]
      if (/[A-Z]/i.test(ch))
        merged.push(plain[pIdx++] || '')
      else merged.push(ch)
    }
    plain = merged.join('')
  }
  return plain
}

const keyedPlain = computed(() => {
  if (!cleanedInput.value)
    return ''
  const r = Math.max(2, Math.min(64, rails.value | 0))
  const ord = keyOrder(key.value, r)
  return decryptWithOrder(maybeReverse(cleanedInput.value), r, ord, keyedOffset.value | 0)
})

// --- Dictionary and helpers (copied/adapted from keywordTransposition) ---
const DICT = [
  'BERLIN',
  'SANBORN',
  'CLOCK',
  'ROTATE',
  'CLUE',
  'HINT',
  'CODE',
  'HOUR',
  'MINUTES',
  'DOT',
  'EAST',
  'NORTH',
  'SOUTH',
  'HOUR',
  'FOLD',
  'ROT',
  'GRID',
  'SORRY',
  'LIE',
  'BEST',
  'HELENA',
  'MONTANA',
  'END',
]

function collectLines(matrix: string[][]): string[] {
  const R = matrix.length
  const C = matrix[0]?.length || 0
  const lines: string[] = []
  // rows
  for (let r = 0; r < R; r++) lines.push(matrix[r].join(''))
  // cols
  for (let c = 0; c < C; c++) {
    const col: string[] = []
    for (let r = 0; r < R; r++) col.push(matrix[r][c] || '')
    lines.push(col.join(''))
  }
  // diag down-right
  for (let k = -(R - 1); k <= C - 1; k++) {
    const diag: string[] = []
    for (let r = 0; r < R; r++) {
      const c = r + k
      if (c >= 0 && c < C)
        diag.push(matrix[r][c] || '')
    }
    if (diag.length)
      lines.push(diag.join(''))
  }
  // diag up-right
  for (let k = 0; k < R + C - 1; k++) {
    const diag: string[] = []
    for (let r = 0; r < R; r++) {
      const c = k - r
      if (c >= 0 && c < C)
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
  const fullHits = Array.from(fullSet).sort((a, b) => b.length - a.length || a.localeCompare(b))
  const partialHits = Array.from(partSet).sort((a, b) => b.length - a.length || a.localeCompare(b))
  return { full, partial, fullHits, partialHits }
}

function buildRailMatrix(plain: string, r: number, off: number = 0): string[][] {
  // Use pathFor to place letters (letters only)
  const s = (plain.match(/[A-Z]/gi) || []).join('')
  if (!s.length || r < 2)
    return []
  const path = pathFor(s.length, r)
  let pathUsed = path
  if (off) {
    const L = path.length
    const k = ((off % L) + L) % L
    if (k)
      pathUsed = Array.from({ length: L }, (_, i) => path[(i + k) % L])
  }
  const C = s.length
  const matrix: string[][] = Array.from({ length: r }, () => new Array(C).fill(''))
  let idx = 0
  for (let i = 0; i < s.length; i++) {
    const rail = pathUsed[i]
    matrix[rail][i] = s[i]
  }
  return matrix
}

const keyedRailMatrix = computed(() => {
  // Use normalized keyedPlain (letters only)
  const r = Math.max(2, rails.value | 0)
  const plain = (keyedPlain.value.match(/[A-Z]/gi) || []).join('')
  return buildRailMatrix(plain, r, keyedOffset.value | 0)
})

const keyedLib = computed(() => keyedPlain.value ? scoreDict(keyedRailMatrix.value) : null)

const sampleEnglishFreq: Record<string, number> = {
  E: 12.7,
  T: 9.06,
  A: 8.17,
  O: 7.51,
  I: 6.97,
  N: 6.75,
  S: 6.33,
  H: 6.09,
  R: 5.99,
  D: 4.25,
  L: 4.03,
  C: 2.78,
  U: 2.76,
  M: 2.41,
  W: 2.36,
  F: 2.23,
  G: 2.02,
  Y: 1.97,
  P: 1.93,
  B: 1.49,
  V: 0.98,
  K: 0.77,
  J: 0.15,
  X: 0.15,
  Q: 0.1,
  Z: 0.07,
}

function scoreChiSquare(s: string) {
  const t = (s.match(/[A-Z]/gi) || []).join('').toUpperCase()
  if (!t.length)
    return Number.POSITIVE_INFINITY
  const counts: Record<string, number> = {}
  for (const ch of t) counts[ch] = (counts[ch] || 0) + 1
  let chi = 0
  for (const L in sampleEnglishFreq) {
    const expected = (sampleEnglishFreq[L] / 100) * t.length
    const observed = counts[L] || 0
    const diff = observed - expected
    chi += (diff * diff) / (expected || 1e-9)
  }
  return chi
}

interface Candidate {
  plain: string
  rails: number
  order: number[]
  score: number
  rail: string[][]
  lib: { full: number, partial: number, fullHits: string[], partialHits: string[] }
}
const bruteResults = ref<Candidate[]>([])
const bfOffset = ref(0)
const isBruteforcing = ref(false)

// --- Grid controls and helpers ---
const showGrid = ref(false)
const gridCols = ref(16)
const angleIndex = ref(0) // 0..14
const angleDeg = computed(() => (angleIndex.value * (180 / 14)))

function buildLinearGrid(text: string, cols: number): string[][] {
  const s = text || ''
  const C = Math.max(1, cols | 0)
  const rows = Math.ceil(s.length / C) || 1
  const m: string[][] = Array.from({ length: rows }, () => new Array(C).fill(''))
  let k = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < C; c++) {
      m[r][c] = s[k] ?? ''
      k++
    }
  }
  return m
}

function rotateGrid(matrix: string[][], deg: number): string[][] {
  if (!matrix.length)
    return []
  const points: { r: number, c: number, ch: string }[] = []
  const R = matrix.length
  const C = matrix[0]?.length || 0
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const ch = matrix[r][c]
      if (ch)
        points.push({ r, c, ch })
    }
  }
  if (!points.length)
    return matrix
  const rad = (deg * Math.PI) / 180
  const sin = Math.sin(rad)
  const cos = Math.cos(rad)
  const cx = (R - 1) / 2
  const cy = (C - 1) / 2
  const rotated = points.map((p) => {
    const x = p.r - cx
    const y = p.c - cy
    const xr = x * cos - y * sin
    const yr = x * sin + y * cos
    return { x: xr, y: yr, ch: p.ch }
  })
  // normalize to integer grid
  const intPts = rotated.map(p => ({ r: Math.round(p.x), c: Math.round(p.y), ch: p.ch }))
  let minR = 0; let minC = 0; let maxR = 0; let maxC = 0
  for (const p of intPts) {
    if (p.r < minR)
      minR = p.r
    if (p.c < minC)
      minC = p.c
    if (p.r > maxR)
      maxR = p.r
    if (p.c > maxC)
      maxC = p.c
  }
  const outR = maxR - minR + 1
  const outC = maxC - minC + 1
  const out: string[][] = Array.from({ length: outR }, () => new Array(outC).fill(''))
  for (const p of intPts) {
    const rr = p.r - minR
    const cc = p.c - minC
    out[rr][cc] = p.ch // last write wins if collision
  }
  return out
}

function gridForText(text: string, cols: number, deg: number): string[][] {
  const base = buildLinearGrid(text, cols)
  if (!deg)
    return base
  return rotateGrid(base, deg)
}

function* permute(arr: number[]) {
  const a = arr.slice()
  const c = Array.from({ length: a.length }).fill(0)
  let i = 1
  yield a.slice()
  while (i < a.length) {
    if (c[i] < i) {
      if (i % 2 === 0)
        [a[0], a[i]] = [a[i], a[0]]
      else [a[c[i]], a[i]] = [a[i], a[c[i]]]
      c[i]++
      i = 1
      yield a.slice()
    }
    else {
      c[i] = 0
      i++
    }
  }
}

function runBruteforce() {
  isBruteforcing.value = true
  try {
    const ct = maybeReverse(cleanedInput.value)
    bruteResults.value = []
    const minR = 4
    const maxR = 5
    for (let r = minR; r <= maxR; r++) {
      const base = Array.from({ length: r }, (_, i) => i)
      let tested = 0
      for (const order of permute(base)) {
        const plain = decryptWithOrder(ct, r, order, bfOffset.value | 0)
        const score = scoreChiSquare(plain)
        const rail = buildRailMatrix(plain, r, bfOffset.value | 0)
        const lib = scoreDict(rail)
        bruteResults.value.push({ plain, rails: r, order: order.slice(), score, rail, lib })
        tested++
        if (tested > 720 && r > 6)
          break
      }
    }
    bruteResults.value.sort((a, b) => {
      if (b.lib.full !== a.lib.full)
        return b.lib.full - a.lib.full
      if (b.lib.partial !== a.lib.partial)
        return b.lib.partial - a.lib.partial
      return a.score - b.score
    })
    bruteResults.value = bruteResults.value.slice(0, Math.max(1, maxCandidates.value | 0))
  }
  finally {
    isBruteforcing.value = false
  }
}

const bestCandidate = computed(() => bruteResults.value[0])

function sendBestToShared() {
  if (bestCandidate.value)
    sharedPayload.value = bestCandidate.value.plain
}

function sendKeyedToShared() {
  if (keyedPlain.value)
    sharedPayload.value = keyedPlain.value
}
// --- Crib Sniffer ----
const snifferEnabled = ref(true)
const snifferCribs = ref('') // e.g., "BERLIN CLOCK LAYER"
const snifferTopPerRail = ref(12) // keep top-N orders per rail

function normLetters(s: string) {
  return (s.match(/[A-Z]/gi) || []).join('').toUpperCase()
}
function parseCribs(s: string): string[] {
  return s.split(/[^A-Z]+/i).map(x => x.trim()).filter(Boolean).map(x => x.toUpperCase())
}
function letterCounts(s: string): Record<string, number> {
  const m: Record<string, number> = {}
  for (const ch of s) m[ch] = (m[ch] || 0) + 1
  return m
}
function hasMultiset(need: Record<string, number>, have: Record<string, number>) {
  for (const k in need) {
    if ((have[k] || 0) < need[k])
      return false
  }
  return true
}
function buildPlainToCipherMap(len: number, r: number, order: number[], off: number) {
  const seq = pathFor(len, r)
  const L = seq.length
  const k = ((off % L) + L) % L
  const seqUsed = k ? Array.from({ length: L }, (_, i) => seq[(i + k) % L]) : seq
  const counts = countsPerRail(seqUsed, r)
  const starts = new Array(r).fill(0)
  let pos = 0
  for (let j = 0; j < r; j++) { const row = order[j]; starts[row] = pos; pos += counts[row] }
  const seen = new Array(r).fill(0)
  const map = new Array(len).fill(0)
  for (let i = 0; i < len; i++) {
    const row = seqUsed[i]
    map[i] = starts[row] + (seen[row]++)
  }
  return map
}

interface SniffScore {
  sum: number
  perWord: { word: string, best: number, at: number }[]
}

function cribScoreForParams(ct: string, r: number, order: number[], off: number, cribs: string[]): SniffScore {
  const C = normLetters(ct)
  const N = C.length
  if (N === 0)
    return { sum: 0, perWord: [] }
  const map = buildPlainToCipherMap(N, r, order, off)
  const have = letterCounts(C)
  let total = 0
  const perWord: SniffScore['perWord'] = []
  for (const wRaw of cribs) {
    const W = normLetters(wRaw)
    if (!W)
      continue
    const need = letterCounts(W)
    if (!hasMultiset(need, have)) { perWord.push({ word: W, best: 0, at: -1 }); continue }
    const m = W.length
    let best = 0; let bestAt = -1
    for (let s = 0; s <= N - m; s++) {
      let hits = 0
      for (let k = 0; k < m; k++) {
        if (C[map[s + k]] === W[k])
          hits++
      }
      if (hits > best) { best = hits; bestAt = s }
      if (best === m)
        break
    }
    // weight longer words a bit more
    total += best + (best >= 3 ? Math.floor(best * (m >= 6 ? 0.5 : 0.25)) : 0)
    perWord.push({ word: W, best, at: bestAt })
  }
  return { sum: total, perWord }
}

async function runSniffedBruteforce() {
  isBruteforcing.value = true
  try {
    bruteResults.value = []
    const ct = maybeReverse(cleanedInput.value)
    const cribs = parseCribs(snifferCribs.value)
    const usingSniffer = snifferEnabled.value && cribs.length > 0
    const minR = 4
    const maxR = 5
    const perRailTop = Math.max(1, Math.min(200, snifferTopPerRail.value | 0))
    for (let r = minR; r <= maxR; r++) {
      const base = Array.from({ length: r }, (_, i) => i)
      const scoredOrders: { order: number[], score: number }[] = []
      let tested = 0
      for (const order of permute(base)) {
        if (usingSniffer) {
          const s = cribScoreForParams(ct, r, order, bfOffset.value | 0, cribs)
          scoredOrders.push({ order: order.slice(), score: s.sum })
        }
        else {
          // fallback: no cribs → treat all equally
          scoredOrders.push({ order: order.slice(), score: 0 })
        }
        tested++
        if (tested > 720 && r > 6)
          break
      }
      scoredOrders.sort((a, b) => b.score - a.score)
      const chosen = usingSniffer ? scoredOrders.slice(0, perRailTop) : scoredOrders
      for (const { order } of chosen) {
        const plain = decryptWithOrder(ct, r, order, bfOffset.value | 0)
        const score = scoreChiSquare(plain)
        const rail = buildRailMatrix(plain, r, bfOffset.value | 0)
        const lib = scoreDict(rail)
        bruteResults.value.push({ plain, rails: r, order: order.slice(), score, rail, lib })
      }
    }
    bruteResults.value.sort((a, b) => {
      if (b.lib.full !== a.lib.full)
        return b.lib.full - a.lib.full
      if (b.lib.partial !== a.lib.partial)
        return b.lib.partial - a.lib.partial
      return a.score - b.score
    })
    bruteResults.value = bruteResults.value.slice(0, Math.max(1, maxCandidates.value | 0))
  }
  finally {
    isBruteforcing.value = false
  }
}
</script>

<template>
  <div class="min-h-full px-4 py-6">
    <h1 class="text-2xl font-bold ">
      Redefence Decrypt
    </h1>

    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2"><input v-model="useShared" type="checkbox" /> Use Shared Payload</label>
        <label class="flex items-center gap-2"><input v-model="keepNonLetters" type="checkbox" /> Keep
          punctuation/spaces</label>
        <label class="flex items-center gap-2"><input v-model="reverseInput" type="checkbox" /> Reverse input</label>
      </div>
      <!-- Grid controls UI -->
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2"><input v-model="showGrid" type="checkbox" /> Grid view</label>
        <label class="flex items-center gap-2">Columns
          <input v-model.number="gridCols" type="number" min="2" class="w-20 ml-2 text-black" />
        </label>
        <label class="flex items-center gap-2">Angle ({{ angleDeg.toFixed(1) }}°)
          <input v-model.number="angleIndex" type="range" min="0" max="14" step="1" class="w-48" />
        </label>
      </div>
      <div v-if="!useShared">
        <label class="block mb-1 text-sm">Input Text</label>
        <textarea v-model="localText" rows="5" class="w-full p-2 font-mono text-black"></textarea>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2">Rails <input
          v-model.number="rails" type="number" min="3" max="64"
          class="w-20 ml-2 text-black"
        /></label>
        <label class="flex items-center gap-2">Key <input
          v-model="key" type="text" class="w-56 ml-2 text-black"
          placeholder="optional"
        /></label>
        <label class="flex items-center gap-2">Offset
          <input v-model.number="keyedOffset" type="number" class="w-20 ml-2 text-black" />
        </label>
        <button class="px-3 py-1 text-sm text-black bg-gray-200 rounded" @click="sendKeyedToShared">
          Send keyed → Payload
        </button>
      </div>

      <div>
        <h2 class="text-lg font-bold">
          Keyed Decrypt
        </h2>
        <div class="text-xs opacity-70">
          Order: {{ keyOrder(key, Math.max(2, rails)) }} · Off {{ keyedOffset }}
        </div>
        <textarea
          :value="keyedPlain" readonly rows="4"
          class="w-full p-2 font-mono text-black border border-black"
        ></textarea>

        <!-- Rail Format table -->
        <div class="max-w-full mt-3">
          <div class="mb-1 text-sm font-semibold">
            Rail Format
          </div>
          <div class="overflow-scroll max-h-48">
            <table v-if="keyedRailMatrix.length" class="text-sm border-collapse">
              <tbody>
                <tr v-for="(row, r) in keyedRailMatrix" :key="`krm-${r}`">
                  <td v-for="(cell, c) in row" :key="`krm-${r}-${c}`" class="px-1 py-0.5  text-center min-w-[1.2em]">
                    {{ cell || '' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="p-2 text-xs text-gray-400">
              No matrix
            </div>
          </div>
        </div>
        <!-- Library Check panel -->
        <!-- Grid view for keyedPlain -->
        <div v-if="showGrid" class="mt-3">
          <div class="mb-1 text-sm font-semibold">
            Grid View (cols {{ gridCols }}, {{ angleDeg.toFixed(1) }}°)
          </div>
          <div class="overflow-auto max-h-64">
            <table class="text-sm border-collapse">
              <tbody>
                <tr v-for="(row, r) in gridForText(keyedPlain, gridCols, angleDeg)" :key="`kg-${r}`">
                  <td v-for="(cell, c) in row" :key="`kg-${r}-${c}`" class="px-1 py-0.5 text-center min-w-[1.2em]">
                    {{ cell || '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="mt-3">
          <div class="mb-1 text-sm font-semibold">
            Library Check
          </div>
          <div v-if="keyedLib" class="space-y-1">
            <div>
              <span class="font-bold">Full Hits:</span>
              <span>{{ keyedLib.full }}</span>
              <span
                v-if="keyedLib.fullHits.length" class="ml-2 text-xs text-gray-300 truncate max-w-[20em]"
                :title="keyedLib.fullHits.join(', ')"
              >
                {{ keyedLib.fullHits.join(', ') }}
              </span>
            </div>
            <div>
              <span class="font-bold">Partial Hits:</span>
              <span>{{ keyedLib.partial }}</span>
              <span
                v-if="keyedLib.partialHits.length" class="ml-2 text-xs text-gray-300 truncate max-w-[20em]"
                :title="keyedLib.partialHits.join(', ')"
              >
                {{ keyedLib.partialHits.join(', ') }}
              </span>
            </div>
          </div>
          <div v-else class="text-xs text-gray-400">
            No library results
          </div>
        </div>
      </div>

      <hr class="opacity-20" />

      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2">Max Rails <input
          v-model.number="maxRails" type="number" min="4"
          max="5"
        />
        </label>
        <label class="flex items-center gap-2">Top N <input
          v-model.number="maxCandidates" type="number" min="1"
          max="5000" class="w-20 ml-2 text-black"
        /></label>
        <label class="flex items-center gap-2">Offset
          <input v-model.number="bfOffset" type="number" class="w-20 ml-2 text-black" />
        </label>
        <button
          class="flex items-center gap-2 px-3 py-1 text-sm text-black bg-gray-200 rounded disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isBruteforcing" :aria-busy="isBruteforcing ? 'true' : 'false'" @click="runBruteforce"
        >
          <span
            v-if="isBruteforcing"
            class="inline-block w-3 h-3 border-2 border-black rounded-full border-t-transparent animate-spin"
          ></span>
          <span>{{ isBruteforcing ? 'Running…' : 'Run Bruteforce' }}</span>
        </button>
        <button
          class="px-3 py-1 text-sm text-black bg-gray-200 rounded disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="!bestCandidate || isBruteforcing" @click="sendBestToShared"
        >
          Send best → Payload
        </button>
      </div>
      <!-- Crib Sniffer -->
      <div class="mt-3 space-y-2">
        <div class="flex flex-wrap items-center gap-4">
          <label class="flex items-center gap-2">
            <input v-model="snifferEnabled" type="checkbox" />
            Use crib sniffer prefilter
          </label>
          <label class="flex items-center gap-2">
            Orders/rail to keep
            <input v-model.number="snifferTopPerRail" type="number" min="1" max="200" class="w-20 ml-2 text-black" />
          </label>
        </div>
        <div>
          <input
            v-model="snifferCribs" type="text" placeholder="Cribs (e.g., BERLIN CLOCK LAYER TWO)"
            class="w-full px-2 py-1 text-black border border-black"
          />
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 text-sm text-black bg-gray-200 rounded disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isBruteforcing" @click="runSniffedBruteforce"
          >
            {{ isBruteforcing ? 'Running…' : 'Sniff + Bruteforce (crib-guided)' }}
          </button>
          <button
            class="px-3 py-1 text-sm text-black bg-gray-200 rounded disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="!bestCandidate || isBruteforcing" @click="sendBestToShared"
          >
            Send best → Payload
          </button>
        </div>
      </div>

      <div v-if="bruteResults.length" class="space-y-3">
        <h2 class="text-lg font-bold">
          Bruteforce Results
        </h2>
        <div v-for="(c, i) in bruteResults" :key="i" class="p-3 ">
          <div class="text-xs">
            Rails {{ c.rails }} · Order {{ c.order.join('-') }} · χ² {{ c.score.toFixed(1) }} · Off {{ bfOffset }}
          </div>
          <textarea
            :value="c.plain" readonly rows="4"
            class="w-full p-2 mt-2 font-mono text-black border border-black"
          ></textarea>
          <!-- Rail Format table -->
          <div class="mt-2">
            <div class="mb-1 text-xs font-semibold">
              Rail Format
            </div>
            <div class="overflow-auto max-h-32">
              <table v-if="c.rail && c.rail.length" class="text-xs border-collapse">
                <tbody>
                  <tr v-for="(row, r) in c.rail" :key="`bfr-rail-${i}-${r}`">
                    <td
                      v-for="(cell, cc) in row" :key="`bfr-rail-${i}-${r}-${cc}`"
                      class="px-1 py-0.5  text-center min-w-[1.2em]"
                    >
                      {{ cell || '' }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="p-2 text-xs text-gray-400">
                No matrix
              </div>
            </div>
          </div>
          <!-- Library Check summary -->
          <!-- Grid view for bruteforce candidate -->
          <div v-if="showGrid" class="mt-2">
            <div class="mb-1 text-xs font-semibold">
              Grid View (cols {{ gridCols }}, {{ angleDeg.toFixed(1) }}°)
            </div>
            <div class="overflow-auto max-h-40">
              <table class="text-xs border-collapse">
                <tbody>
                  <tr v-for="(row, r) in gridForText(c.plain, gridCols, angleDeg)" :key="`bg-${i}-${r}`">
                    <td
                      v-for="(cell, cc) in row" :key="`bg-${i}-${r}-${cc}`"
                      class="px-1 py-0.5 text-center min-w-[1.2em]"
                    >
                      {{ cell || '' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="mt-1">
            <div class="mb-1 text-xs font-semibold">
              Library Check
            </div>
            <div>
              <span class="font-bold">Full Hits:</span>
              <span>{{ c.lib.full }}</span>
              <span
                v-if="c.lib.fullHits.length" class="ml-2 text-xs text-gray-300 truncate max-w-[15em]"
                :title="c.lib.fullHits.join(', ')"
              >
                {{ c.lib.fullHits.join(', ') }}
              </span>
            </div>
            <div>
              <span class="font-bold">Partial Hits:</span>
              <span>{{ c.lib.partial }}</span>
              <span
                v-if="c.lib.partialHits.length" class="ml-2 text-xs text-gray-300 truncate max-w-[15em]"
                :title="c.lib.partialHits.join(', ')"
              >
                {{ c.lib.partialHits.join(', ') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
