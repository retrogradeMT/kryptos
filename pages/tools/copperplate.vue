<script lang="ts" setup>
import { useRoute } from '#imports'
import { computed, onMounted, ref, watch } from 'vue'
import PageTitle from '~/components/PageTitle.vue'
import { useDefaults } from '~/composables/useDefaults'
// ...

// Sidebar controls + URL state schema for Tools parent
definePageMeta({
  controls: {
    input: false,
    find: true,
    highlights: true,
    orientation: true,
    print: true,
    sendTo: true,
    letterFrequency: true,
    selectionTracker: true,
    offset: false,
    diameter: false,
    wordStack: false,
  },
  urlState: {
    text: 'text',
    find: 'find',
    mode: { key: 'mode', type: 'string', default: 'all' },
    wrap: { key: 'wrap', type: 'bool', default: true },
    back: { key: 'back', type: 'bool', default: true },
    color: { key: 'color', type: 'string', default: '#ffd54f' },
    orientation: { key: 'orientation', type: 'string', default: 'normal' },
    print: { key: 'print', type: 'bool', default: false },
  },
})

// --- URL & seed text --------------------------------------------------------
const route = useRoute()
const seedTA = ref<HTMLTextAreaElement | null>(null)
const STATIC_GRID_TEXT = ref('')

const { applyDefaultIfEmpty } = useDefaults()

onMounted(() => {
  const q = String(route.query.text || '')
  if (q) {
    STATIC_GRID_TEXT.value = decodeURIComponent(q)
  }
  else if (seedTA.value?.value) {
    // IMPORTANT: do not trim; keep exact line breaks and spacing
    STATIC_GRID_TEXT.value = seedTA.value.value
  }
  else {
    // <- If neither query nor hidden seed, auto-fill from global default
    applyDefaultIfEmpty({ target: STATIC_GRID_TEXT, source: 'copperplate', routeQuery: route.query as any })
  }
})

watch(() => route.query.text, (v) => {
  if (typeof v === 'string')
    STATIC_GRID_TEXT.value = decodeURIComponent(v)
})

// --- Orientation & print (via URL: orientation=normal|tree|roots, print=1) ---
const gridOrientation = computed(() => (String(route.query.orientation || 'normal') as 'normal' | 'tree' | 'roots'))
const printMode = computed(() => String(route.query.print || '') === '1')

// --- Parsing & rotation with padding ----------------------------------------
function parseGridText(s: string) {
  // Preserve every character including spaces; only strip a trailing \r
  const rows = s.split(/\n/).map(r => r.endsWith('\r') ? r.slice(0, -1) : r)
  return rows.map(r => r.split(''))
}
function padToRect(grid: string[][], padChar = ' ') {
  const Cmax = Math.max(...grid.map(r => r.length))
  return grid.map(row => (row.length < Cmax ? row.concat(Array.from({ length: Cmax - row.length }).fill(padChar)) : row))
}
function rotateCW(grid: string[][]) {
  const R = grid.length; const C = Math.max(...grid.map(r => r.length))
  const out: string[][] = []
  for (let c = 0; c < C; c++) { const row: string[] = []; for (let r = R - 1; r >= 0; r--) row.push(grid[r][c]); out.push(row) }
  return out
}
function rotateCCW(grid: string[][]) {
  const R = grid.length; const C = Math.max(...grid.map(r => r.length))
  const out: string[][] = []
  for (let c = C - 1; c >= 0; c--) { const row: string[] = []; for (let r = 0; r < R; r++) row.push(grid[r][c]); out.push(row) }
  return out
}

const parsedGrid = computed(() => padToRect(parseGridText(STATIC_GRID_TEXT.value), ' '))
const orientedGrid = computed(() => {
  const g = parsedGrid.value
  if (!g.length)
    return [] as string[][]
  if (gridOrientation.value === 'tree')
    return rotateCCW(g)
  if (gridOrientation.value === 'roots')
    return rotateCW(g)
  return g
})

// --- Bark mark (row markers from bottom using deltas 5,+4,+8,+4,+4) ----------
const barkMarkerDeltas = [5, 4, 8, 4, 4]
const barkMarkerRows = computed(() => {
  const R = orientedGrid.value.length; if (!R)
    return new Set<number>()
  let s = 0; const idxs: number[] = []
  for (const d of barkMarkerDeltas) { s += d; idxs.push(R - s) }
  return new Set(idxs.filter(i => i >= 0 && i < R))
})

// --- Find overlay (rows/cols/diag, wrap, backwards) via URL ------------------
function mod(n: number, m: number) { return ((n % m) + m) % m }
function charAtRC(grid: string[][], r: number, c: number) { const row = grid[r]; return (row && c >= 0 && c < row.length) ? row[c] : undefined }

function scanRows(grid: string[][], q: string, includeWrap = true, backwards = false) {
  const res: number[][][] = []; if (!grid.length || !q)
    return res; const L = q.length
  for (let r = 0; r < grid.length; r++) {
    const C = grid[r].length
    for (let c0 = 0; c0 < C; c0++) {
      if (!includeWrap) {
        if (!backwards && c0 + L > C)
          continue; if (backwards && c0 - (L - 1) < 0)
          continue
      }
      let ok = true; const cells: number[][] = []
      for (let k = 0; k < L; k++) {
        const c = backwards ? mod(c0 - k, C) : mod(c0 + k, C)
        const ch = charAtRC(grid, r, c)
        if (!ch || ch.toLowerCase() !== q[k].toLowerCase()) { ok = false; break }
        cells.push([r, c])
      }
      if (ok)
        res.push(cells)
    }
  }
  return res
}
function scanCols(grid: string[][], q: string, includeWrap = true, backwards = false) {
  const res: number[][][] = []; if (!grid.length || !q)
    return res; const L = q.length; const R = grid.length; const Cmax = Math.max(...grid.map(r => r.length))
  for (let c = 0; c < Cmax; c++) {
    for (let r0 = 0; r0 < R; r0++) {
      if (!includeWrap) {
        if (!backwards && r0 + L > R)
          continue; if (backwards && r0 - (L - 1) < 0)
          continue
      }
      let ok = true; const cells: number[][] = []
      for (let k = 0; k < L; k++) {
        const r = backwards ? mod(r0 - k, R) : mod(r0 + k, R)
        const ch = charAtRC(grid, r, c)
        if (!ch || ch.toLowerCase() !== q[k].toLowerCase()) { ok = false; break }
        cells.push([r, c])
      }
      if (ok)
        res.push(cells)
    }
  }
  return res
}
function scanDiag(grid: string[][], q: string, dr: number, dc: number, includeWrap = true) {
  const res: number[][][] = []; if (!grid.length || !q)
    return res; const L = q.length; const R = grid.length; const Cmax = Math.max(...grid.map(r => r.length))
  for (let r0 = 0; r0 < R; r0++) {
    for (let c0 = 0; c0 < Cmax; c0++) {
      let ok = true; const cells: number[][] = []; let r = r0; let c = c0
      for (let k = 0; k < L; k++) {
        const ch = charAtRC(grid, r, c)
        if (!ch || ch.toLowerCase() !== q[k].toLowerCase()) { ok = false; break }
        cells.push([r, c])
        r = includeWrap ? mod(r + dr, R) : r + dr
        c = includeWrap ? mod(c + dc, Cmax) : c + dc
        if (!includeWrap && (r < 0 || r >= R || c < 0 || c >= Cmax))
          break
      }
      if (ok && cells.length === L)
        res.push(cells)
    }
  }
  return res
}

const findQuery = computed(() => String(route.query.find || '').trim())
const findMode = computed(() => String(route.query.mode || 'all'))
const findWrap = computed(() => String(route.query.wrap || '1') !== '0')
const findBack = computed(() => String(route.query.back || '1') !== '0')
const findColor = computed(() => String(route.query.color || '#ffd54f'))

const findMatches = computed(() => {
  const g = orientedGrid.value; const q = findQuery.value
  if (!g.length || !q)
    return [] as number[][][]
  const wrap = findWrap.value; const back = findBack.value; const mode = findMode.value
  const out: number[][][] = []
  if (mode === 'rows' || mode === 'all') {
    out.push(...scanRows(g, q, wrap, false)); if (back)
      out.push(...scanRows(g, q, wrap, true))
  }
  if (mode === 'cols' || mode === 'all') {
    out.push(...scanCols(g, q, wrap, false)); if (back)
      out.push(...scanCols(g, q, wrap, true))
  }
  if (mode === 'diagDown' || mode === 'all') {
    out.push(...scanDiag(g, q, +1, +1, wrap)); if (back)
      out.push(...scanDiag(g, q, -1, -1, wrap))
  }
  if (mode === 'diagUp' || mode === 'all') {
    out.push(...scanDiag(g, q, -1, +1, wrap)); if (back)
      out.push(...scanDiag(g, q, +1, -1, wrap))
  }
  return out
})
const findKeys = computed(() => { const s = new Set<string>(); for (const cells of findMatches.value) { for (const [r, c] of cells) { s.add(`${r}-${c}`) } } return s })

// --- Selection & actions -----------------------------------------------------
const selectedCells = ref<{ char: string, row: number, col: number, order: number }[]>([])

function handleCellClick(cell: { char: string, row: number, col: number }) {
  const key = `${cell.row}-${cell.col}`
  const i = selectedCells.value.findIndex(c => `${c.row}-${c.col}` === key)
  if (i === -1) { selectedCells.value.push({ ...cell, order: selectedCells.value.length + 1 }) }
  else { selectedCells.value.splice(i, 1); selectedCells.value.forEach((c, idx) => c.order = idx + 1) }
}

function getCharAt(r: number, c: number) {
  const g = orientedGrid.value; if (r < 0 || r >= g.length)
    return ''; const row = g[r]; if (!row || c < 0 || c >= row.length)
    return ''; return row[c]
}
function getRow(r: number) { const g = orientedGrid.value; return (r >= 0 && r < g.length) ? g[r].join('') : '' }

function copy(text: string) {
  try { navigator.clipboard.writeText(text) }
  catch (e) { console.warn('Clipboard failed', e) }
}

function clearSelection() { selectedCells.value = [] }
function removeLast() {
  if (selectedCells.value.length)
    selectedCells.value.pop()
}
function copySelectedPath() {
  const s = selectedCells.value.map(c => c.char || '').join(''); if (s)
    copy(s)
}
function copyRowSpan() {
  if (selectedCells.value.length < 2)
    return; const [a, b] = selectedCells.value.slice().sort((x, y) => x.order - y.order); if (a.row !== b.row)
    return; const r = a.row; const c0 = Math.min(a.col, b.col); const c1 = Math.max(a.col, b.col); let out = ''; for (let c = c0; c <= c1; c++) out += getCharAt(r, c); copy(out)
}
function copyColSpan() {
  if (selectedCells.value.length < 2)
    return; const [a, b] = selectedCells.value.slice().sort((x, y) => x.order - y.order); if (a.col !== b.col)
    return; const c = a.col; const r0 = Math.min(a.row, b.row); const r1 = Math.max(a.row, b.row); let out = ''; for (let r = r0; r <= r1; r++) out += getCharAt(r, c); copy(out)
}
function rowsBetween() {
  if (selectedCells.value.length < 2)
    return ''; const [a, b] = selectedCells.value.slice().sort((x, y) => x.order - y.order); const r0 = Math.min(a.row, b.row); const r1 = Math.max(a.row, b.row); const lines: string[] = []; for (let r = r0; r <= r1; r++) lines.push(getRow(r)); return lines.join('\n')
}
function copyRowsBetween() {
  const t = rowsBetween(); if (t)
    copy(t)
}
// Replace sendRowsBetweenToDMS with sendRowsBetweenToTrans
function sendRowsBetweenToTrans() {
  const t = rowsBetween(); if (!t)
    return
  const url = `/tools/keywordTransposition?text=${encodeURIComponent(t)}`
  try { window.open(url, '_blank') }
  catch {}
}
</script>

<template>
  <div :class="printMode ? 'bg-white text-black' : ''" class="min-h-full">
    <div class="px-4 py-6">
      <PageTitle class="uppercase" title="Kryptos Copperplate" size="lg" :display="true">
        <template #subtitle>
          Static grid explorer • selectable rows/cols • TREE/ROOTS orientation
        </template>
      </PageTitle>

      <!-- Hidden seed (fallback) -->
      <textarea
        ref="seedTA" aria-hidden="true" tabindex="-1"
        style="position:absolute;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;"
      ></textarea>

      <!-- Grid -->
      <section class="mt-4">
        <h3 class="mb-1 font-semibold text-green-400">
          Static Grid
        </h3>
        <div
          class="relative text-lg bg-gray-900 border shadow-inner scanlines font-kryptos text-lime-300 border-primary"
        >
          <div>
            <div v-for="(row, rIdx) in orientedGrid" :key="`row-${rIdx}`" class="flex">
              <!-- left-edge bark marker gutter -->
              <span
                class="w-3 mr-1 text-right select-none"
                :style="{ color: barkMarkerRows.has(rIdx) ? (printMode ? '#000' : '#f59e0b') : 'transparent' }"
                title="Bark mark"
              >●</span>

              <span
                v-for="(ch, cIdx) in row" :key="`c-${cIdx}`" class="px-1 cursor-pointer select-none" :style="{
                  color: findKeys.has(`${rIdx}-${cIdx}`) ? '#000' : '#a7f3d0',
                  backgroundColor: findKeys.has(`${rIdx}-${cIdx}`) ? findColor : 'transparent',
                  border: printMode ? '1px solid #ddd' : '1px solid transparent',
                }" @click="handleCellClick({ char: ch, row: rIdx, col: cIdx })"
              >{{ ch }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="mt-3">
        <div class="flex flex-wrap gap-2 text-sm">
          <button class="px-2 py-1" @click="clearSelection">
            Clear
          </button>
          <button class="px-2 py-1" :disabled="!selectedCells.length" @click="removeLast">
            Remove Last
          </button>
          <button class="px-2 py-1" :disabled="!selectedCells.length" @click="copySelectedPath">
            Copy Path
          </button>
          <button class="px-2 py-1" :disabled="selectedCells.length < 2" @click="copyRowSpan">
            Copy Row Span
          </button>
          <button class="px-2 py-1" :disabled="selectedCells.length < 2" @click="copyColSpan">
            Copy Col Span
          </button>
          <button class="px-2 py-1" :disabled="selectedCells.length < 2" @click="copyRowsBetween">
            Copy Rows
            Between
          </button>
          <button class="px-2 py-1" :disabled="selectedCells.length < 2" @click="sendRowsBetweenToTrans">
            Send Rows
            Between
            → Transposition
          </button>
        </div>
        <textarea
          :value="selectedCells.map(c => `${c.char} (r${c.row},c${c.col}) #${c.order}`).join('\n')" rows="5"
          class="w-full p-2 mt-2 font-mono text-black border" readonly
        ></textarea>
        <textarea
          ref="seedTA" aria-hidden="true" tabindex="-1"
          style="position:absolute;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;"
        >
EMUFPHZLRFAXYUSDJKZLDKRNSHGNFIVJ
YQTQUXQBQVYUVLLTREVJYQTMKYRDMFD
VFPJUDEEHZWETZYVGWHKKQETGFQJNCE
GGWHKK?DQMCPFQZDQMMIAGPFXHQRLG
TIMVMZJANQLVKQEDAGDVFRPJUNGEUNA
QZGZLECGYUXUEENJTBJLBQCRTBJDFHRR
YIZETKZEMVDUFKSJHKFWHKUWQLSZFTI
HHDDDUVH?DWKBFUFPWNTDFIYCUQZERE
EVLDKFEZMOQQJLTTUGSYQPFEUNLAVIDX
FLGGTEZ?FKZBSFDQVGOGIPUFXHHDRKF
FHQNTGPUAECNUVPDJMQCLQUMUNEDFQ
ELZZVRRGKFFVOEEXBDMVPNFQXEZLGRE
DNQFMPNZGLFLPMRJQYALMGNUVPDXVKP
DQUMEBEDMHDAFMJGZNUPLGEWJLLAETG
ENDYAHROHNLSRHEOCPTEOIBIDYSHNAIA
CHTNREYULDSLLSLLNOHSNOSMRWXMNE
TPRNGATIHNRARPESLNNELEBLPIIACAE
WMTWNDITEENRAHCTENEUDRETNHAEOE
TFOLSEDTIWENHAEIOYTEYQHEENCTAYCR
EIFTBRSPAMHHEWENATAMATEGYEERLB
TEEFOASFIOTUETUAEOTOARMAEERTNRTI
BSEDDNIAAHTTMSTEWPIEROAGRIEWFEB
AECTDDHILCEIHSITEGOEAOSDDRYDLORIT
RKLMLEHAGTDHARDPNEOHMGFMFEUHE
ECDMRIPFEIMEHNLSSTTRTVDOHW?OBKR
UOXOGHULBSOLIFBBWFLRVQQPRNGKSSO
TWTQSJQSSEKZZWATJKLUDIAWINFBNYP
VTTMZFPKWGDKZXTJCDIGKUHUAUEKCAR
</textarea>
        <!-- <textarea
          ref="seedTA" aria-hidden="true" tabindex="-1"
          style="position:absolute;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;"
        >
RACKEUAUHUKGIDCJTXZKDGWKPFZMTTV
PYNBFNIWAIDULKJTAWZZKESSQJSQTWT
OSSKGNRPQQVRLFWBBFILOSBLUHGOXOU
RKBO?WHODVTRTTSSLNHEMIEFPIRMDCE
EHUEFMFGMHOENPDRAHDTGAHELMLKR
TIROLDYRDDSOAEOGETISHIECLIHDDTCEA
BEFWEIRGAOREIPWETSMTTHAAINDDESB
ITRNTREEAMRAOTOEAUTEUTOIFSAOFEET
BLREEYGETAMATANEWEHHMAPSRBTFIE
RCYATCNEEHQYETYOIEAHNEWITDESLOFT
EOEAHNTERDUENETCHARNEETIDNWTMW
EACAIIPLBELENNLSEPRARNHITAGNRPT
ENMXWRMSONSHONLLSLLSDLUYERNTHC
AIANHSYDIBIOETPCOEHRSLNHORHAYDNE
GTEALLJWEGLPUNZGJMFADHMDEBEMUQD
PKVXDPVUNGMLAYQJRMPLFLGZNPMFQND
ERGLZEXQFNPVMDBXEEOVFFKGRRVZZLE
QFDENUMUQLCQMJDPVUNCEAUPGTNQHF
FKRDHHXFUPIGOGVQDFSBZKF?ZETGGLF
XDIVALNUEFPQYSGUTTLJQQOMZEFKDLVE
EREZQUCYIFDTNWPFUFBKWD?HVUDDDHH
ITFZSLQWUKHWFKHJSKFUDVMEZKTEZIY
RRHFDJBTRCQBLJBTJNEEUXUYGCELZGZQ
ANUEGNUJPRFVDGADEQKVLQNAJZMVMIT
GLRQHXFPGAIMMQDZQFPCMQD?KKHWGG
ECNJQFGTEQKKHWGVYZTEWZHEEDUJPFV
DFMDRYKMTQYJVERTLLVUYVQBQXUQTQY
JVIFNGHSNRKDLZKJDSUYXAFRLZHPFUME
</textarea> -->
      </section>
    </div>
  </div>
</template>

<style scoped>
.scanlines { background-image: repeating-linear-gradient(transparent, transparent 23px, rgba(255,255,255,0.04) 24px); }
.border-primary { border-color: rgba(255,255,255,0.12); }
</style>
