<script setup>
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  CurrencyDollarIcon,
  LinkIcon,
  MapPinIcon,
  PencilIcon,
} from '@heroicons/vue/20/solid'
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useStorage } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

// leave empty; we’ll seed from hidden textarea if present
const seedTA = ref(null)

onMounted(() => {
  if (!STATIC_GRID_TEXT.value && seedTA.value) {
    const val = seedTA.value.value || ''
    STATIC_GRID_TEXT.value = val.trim()
  }
})

// --- Selection helpers for Static Grid (copperplate) ---
const selPath = computed(() => selectedCells.value
  .slice()
  .sort((a, b) => a.order - b.order))

function getCharAt(r, c) {
  const g = orientedGrid.value
  if (!g || r < 0 || r >= g.length)
    return ''
  const row = g[r]
  if (!row || c < 0 || c >= row.length)
    return ''
  return row[c]
}

function copyToClipboard(text) {
  try { navigator.clipboard.writeText(text) }
  catch (e) { console.warn('Clipboard failed', e) }
}

function copySelectedPath() {
  const text = selPath.value.map(c => c.char || '').join('')
  copyToClipboard(text)
}

function copyRowSpan() {
  if (selectedCells.value.length < 2)
    return
  const [a, b] = selPath.value
  if (a.row !== b.row) { alert('Pick two cells in the SAME row for Row Span'); return }
  const r = a.row
  const c0 = Math.min(a.col, b.col)
  const c1 = Math.max(a.col, b.col)
  let out = ''
  for (let c = c0; c <= c1; c++) out += getCharAt(r, c)
  copyToClipboard(out)
}

function copyColSpan() {
  if (selectedCells.value.length < 2)
    return
  const [a, b] = selPath.value
  if (a.col !== b.col) { alert('Pick two cells in the SAME column for Column Span'); return }
  const c = a.col
  const r0 = Math.min(a.row, b.row)
  const r1 = Math.max(a.row, b.row)
  let out = ''
  for (let r = r0; r <= r1; r++) out += getCharAt(r, c)
  copyToClipboard(out)
}

// --- Row block helpers ---
function getRowString(r) {
  const g = orientedGrid.value
  if (!g || r < 0 || r >= g.length)
    return ''
  return g[r].join('')
}

function getRowsBetweenText() {
  if (selectedCells.value.length < 2)
    return ''
  const [a, b] = selPath.value
  const r0 = Math.min(a.row, b.row)
  const r1 = Math.max(a.row, b.row)
  const lines = []
  for (let r = r0; r <= r1; r++) lines.push(getRowString(r))
  return lines.join('\n')
}

function copyRowsBetween() {
  const text = getRowsBetweenText()
  if (!text) { alert('Pick any two cells to define start/end rows'); return }
  copyToClipboard(text)
}

function sendRowsBetweenToDMS() {
  const text = getRowsBetweenText()
  if (!text) { alert('Pick any two cells to define start/end rows'); return }
  const url = `/dms?inputMode=freetext&text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
}

function sendSelectionToDMS(mode = 'path') {
  let text = ''
  if (mode === 'row') {
    if (selectedCells.value.length < 2) { alert('Pick two cells in same row'); return }
    const [a, b] = selPath.value
    if (a.row !== b.row) { alert('Row mode: choose same row'); return }
    const r = a.row; const c0 = Math.min(a.col, b.col); const c1 = Math.max(a.col, b.col)
    for (let c = c0; c <= c1; c++) text += getCharAt(r, c)
  }
  else if (mode === 'col') {
    if (selectedCells.value.length < 2) { alert('Pick two cells in same column'); return }
    const [a, b] = selPath.value
    if (a.col !== b.col) { alert('Column mode: choose same column'); return }
    const c = a.col; const r0 = Math.min(a.row, b.row); const r1 = Math.max(a.row, b.row)
    for (let r = r0; r <= r1; r++) text += getCharAt(r, c)
  }
  else {
    text = selPath.value.map(c => c.char || '').join('')
  }
  const url = `/dms?inputMode=freetext&text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
}

// Static grid + orientation (TREE/ROOTS)
const STATIC_GRID_TEXT = ref('')
const gridOrientation = ref('normal') // 'normal' | 'tree' | 'roots'

function parseGridText(s) {
  const rows = s.split(/\r?\n/).map(r => r.trim()).filter(Boolean)
  if (!rows.length)
    return []
  return rows.map(r => r.split('')) // no padding, ragged rows preserved
}
function padToRect(grid, padChar = ' ') {
  if (!grid || !grid.length)
    return []
  const Cmax = Math.max(...grid.map(r => r.length))
  return grid.map((row) => {
    const r = row.slice()
    while (r.length < Cmax) r.push(padChar)
    return r
  })
}

function rotateGridCW(grid) {
  if (!grid.length)
    return []
  const R = grid.length
  const C = Math.max(...grid.map(r => r.length))
  const out = []
  for (let c = 0; c < C; c++) {
    const row = []
    for (let r = R - 1; r >= 0; r--) {
      row.push(grid[r][c])
    }
    out.push(row)
  }
  return out
}

function rotateGridCCW(grid) {
  if (!grid.length)
    return []
  const R = grid.length
  const C = Math.max(...grid.map(r => r.length))
  const out = []
  for (let c = C - 1; c >= 0; c--) {
    const row = []
    for (let r = 0; r < R; r++) {
      row.push(grid[r][c])
    }
    out.push(row)
  }
  return out
}

const parsedGrid = computed(() => parseGridText(STATIC_GRID_TEXT.value))
const orientedGrid = computed(() => {
  let g = parsedGrid.value
  if (!g.length)
    return []
  // Pad ragged rows so rotations preserve column alignment
  const rect = padToRect(g, ' ')
  if (gridOrientation.value === 'tree') {
    // TREE: counter‑clockwise (original row 1 becomes column 1)
    return rotateGridCCW(rect)
  }
  if (gridOrientation.value === 'roots') {
    // ROOTS: clockwise (opposite of TREE)
    return rotateGridCW(rect)
  }
  return rect
})

// --- Bark mark helpers (left-edge row markers counted from bottom)
// Sequence provided (from bottom, then relative jumps): 5, +4, +8, +4, +4
const barkMarkerDeltas = [5, 4, 8, 4, 4]
const barkMarkerRows = computed(() => {
  const g = orientedGrid.value
  const R = g?.length || 0
  if (!R)
    return new Set()
  // turn deltas into cumulative offsets from the bottom
  const cumul = []
  let s = 0
  for (const d of barkMarkerDeltas) { s += d; cumul.push(s) }
  const set = new Set()
  for (const off of cumul) {
    const idx = R - off // 0-based row index
    if (idx >= 0 && idx < R)
      set.add(idx)
  }
  return set
})

// --- Find Word tool ---
const findQuery = ref('')
const findMode = ref('all') // 'rows' | 'cols' | 'diagDown' | 'diagUp' | 'all'
const findWrap = ref(true)
const findColor = ref('#ffd54f')
const findBackwards = ref(true)

// --- DMS-style Find Word helpers (8 directions, wrap, backwards) ---
function mod(n, m) { return ((n % m) + m) % m }
function charAtRC(grid, r, c) {
  if (!grid || r < 0)
    return undefined
  if (r >= grid.length)
    return undefined
  const row = grid[r]
  if (!row || c < 0 || c >= row.length)
    return undefined
  return row[c]
}
function scanRows(grid, q, includeWrap = true, backwards = false) {
  const res = []; if (!grid.length || !q)
    return res; const L = q.length
  for (let r = 0; r < grid.length; r++) {
    const C = grid[r]?.length || 0; if (!C)
      continue
    for (let c0 = 0; c0 < C; c0++) {
      if (!includeWrap) {
        if (!backwards && c0 + L > C)
          continue; if (backwards && c0 - (L - 1) < 0)
          continue
      }
      let ok = true; const cells = []
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
function scanCols(grid, q, includeWrap = true, backwards = false) {
  const res = []; if (!grid.length || !q)
    return res; const L = q.length; const R = grid.length
  const Cmax = Math.max(...grid.map(r => r.length))
  for (let c = 0; c < Cmax; c++) {
    for (let r0 = 0; r0 < R; r0++) {
      if (!includeWrap) {
        if (!backwards && r0 + L > R)
          continue; if (backwards && r0 - (L - 1) < 0)
          continue
      }
      let ok = true; const cells = []
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
function scanDiag(grid, q, dr, dc, includeWrap = true) {
  const res = []; if (!grid.length || !q)
    return res; const L = q.length
  const R = grid.length; const Cmax = Math.max(...grid.map(r => r.length))
  for (let r0 = 0; r0 < R; r0++) {
    for (let c0 = 0; c0 < Cmax; c0++) {
      let ok = true; const cells = []
      let r = r0; let c = c0
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

const findMatches = computed(() => {
  const g = orientedGrid.value; const q = findQuery.value.trim()
  if (!g.length || !q)
    return []
  const wrap = !!findWrap.value
  const incBack = !!findBackwards.value
  const out = []
  const mode = findMode.value
  if (mode === 'rows' || mode === 'all') {
    out.push(...scanRows(g, q, wrap, false))
    if (incBack)
      out.push(...scanRows(g, q, wrap, true))
  }
  if (mode === 'cols' || mode === 'all') {
    out.push(...scanCols(g, q, wrap, false))
    if (incBack)
      out.push(...scanCols(g, q, wrap, true))
  }
  if (mode === 'diagDown' || mode === 'all') {
    out.push(...scanDiag(g, q, +1, +1, wrap))
    if (incBack)
      out.push(...scanDiag(g, q, -1, -1, wrap))
  }
  if (mode === 'diagUp' || mode === 'all') {
    out.push(...scanDiag(g, q, -1, +1, wrap))
    if (incBack)
      out.push(...scanDiag(g, q, +1, -1, wrap))
  }
  return out
})

const findHighlightKeys = computed(() => {
  const set = new Set()
  for (const cells of findMatches.value) { for (const [r, c] of cells) { set.add(`${r}-${c}`) } }
  return set
})

const inputMode = ref('wordlist') // 'wordlist' | 'freetext' | 'morse'
const freeText = ref('')
const morseInput = ref('')
const morseDot = ref('.')
const morseDash = ref('-')
const morseMapStyle = ref('12') // '12' (dot→1 dash→2) or '01' (dot→0 dash→1)
const printMode = ref(false)

const tabs = ref([
  { name: 'Grid', href: '#', current: true },
])

function setActiveTab(tabName) {
  tabs.value.forEach((tab) => {
    tab.current = (tab.name === tabName)
  })
}
const sidebarOpen = ref(false)

const navigation = [
  { name: 'Dashboard', href: '#', icon: Bars3Icon, current: true },
  { name: 'Settings', href: '#', icon: XMarkIcon, current: false },
]
// leave this here
// const wordInputsWithE = ref([
//   'EEVIRTUALLYE',
//   'EEEEEEINVISIBLE',
//   'EESHADOWEE',
//   'FORCESEEEEE',
//   'LUCIDEEE',
//   'MEMORYE',
//   'RQ',
//   'SOS',
//   'EDIGETALEEE',
//   'INTERPRETATIO',
//   'TISYOUR',
//   'POSITIONE',
// ])

// const wordInputs = ref([
//   'VIRTUALLY',
//   'INTERPRETATIU',
//   'INVISIBLE',
//   'TISYOUR',
//   'LUCID',
//   'SHADOW',
//   'POSITION',
//   'MEMORY',
//   'FORCES',
//   'DIGITAL',
// ])
// const wordInputs = ref([
//   'OXNIKRBYRXVCBROYMZDOYSLSNICRXKSKMRDXBOIEVNCVVCVVXYRCXYCWBGHWXODZBXQKDSRXBKBZOCVXXOVOLVZSSKMKOGWDGXNSDOOXBKRMDOXOENBODXRKOYODPYVCONDSGOXRKOSYIDOIAROOXMDKIMBOSPDLBCZKWRROGOXKDKWKDOQIOOBVLDOOPYKCPSYDEODEKOYDYKBWKOOBDXBDSLCONNXSKKRDDWCDOGZSOBYKQBSOGPOLKOMDNNRSVMOSRCSDOQYOKYCNNBINVYBSDBUVWVORKQDNRKBNZXOYRWQPWPOEROOMNWBSZPOSWORXVCCDDBDFNYRG',
// ])

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
  'SLOWLY',
  'DESPAR',
  'ATLYSL',
  'OWLYTH',
  'EREMAI',
  'NSOFPA',
  'SSAGED',
  'EBRIST',
  'HATENC',
  'UMBERE',
  'DTHELO',
  'WERPAR',
  'TOFTHE',
  'DOORWA',
  'YWASRE',
  'MOVEDW',
  'ITHTRE',
  'MBLING',
  'HANDSI',
  'MADEAT',
  'INYBRE',
  'ACHINT',
  'HEUPPE',
  'RLEFTH',
  'ANDCOR',
  'NERAND',
  'THENWI',
  'DENING',
  'THEHOL',
  'EALITT',
  'LEIINS',
  'ERTEDT',
  'HECAND',
  'LEANDP',
  'EEREDI',
  'NTHEHO',
  'TAIRES',
  'CAPING',
  'FROMTH',
  'ECHAMB',
  'ERCAUS',
  'EDTHEF',
  'LAMETO',
  'FLICKE',
  'RBUTPR',
  'ESENTL',
  'YDETAI',
  'LSOFTH',
  'EROOMW',
  'ITHINE',
  'MERGED',
  'FROMTH',
  'EMISTX',
  'CANYOU',
  'SEEANY',
  'THINGQ',
])

const useExtendedWords = ref(false)
const activeWordSet = computed(() => useExtendedWords.value ? wordInputsWithE.value : wordInputs.value)

//  Really interesting results
// const wordInputs = ref([
//   'EEVIRTUALLYE',
//   'EEEEEEINVISIBLE',
//   'EESHADOWEE',
//   'EEEEESECROF',

// ])
const diameterScanResults = ref([])
const diameter = ref(16)
const reverseRows = ref(false)
const reverseColumns = ref(false)
const offset = ref(0)

const selectedCells = ref([])

const tineLength = ref(5)

const wordColors = [
  '#ffeae5',
  '#ffb3bd',
  '#ffd5b3',
  '#b3ffb4',
  '#ccecff',
  '#ffb3bd',
  '#ffede5',
  '#e5f7ff',
  '#f2e5ff',
  '#b3ffb4',
  '#80c8ff',
  '#f7e5ff',
]

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
    const s = morseInput.value.replace(/\s+/g, '')
    let out = ''
    for (const ch of s) {
      if (ch === morseDot.value)
        out += (morseMapStyle.value === '12' ? '1' : '0')
      else if (ch === morseDash.value)
        out += (morseMapStyle.value === '12' ? '2' : '1')
    }
    return out
  }
})

const letterColorMap = computed(() => {
  const map = []
  activeWordSet.value.forEach((word, wordIdx) => {
    for (let i = 0; i < word.length; i++) {
      map.push(wordColors[wordIdx])
    }
  })
  return map
})

function getWrappedGrid(d, useExtended = useExtendedWords.value) {
  let flat
  if (inputMode.value === 'wordlist') {
    flat = (useExtended ? wordInputsWithE.value : wordInputs.value).join('')
  }
  else {
    flat = flatText.value
  }
  const rows = Math.ceil(flat.length / d)
  const rotated = flat.slice(offset.value) + flat.slice(0, offset.value)
  const padded = rotated.padEnd(rows * d, '.')

  const colorSource = (inputMode.value === 'wordlist')
    ? (useExtended ? wordInputsWithE.value : wordInputs.value)
    : [flat]
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
// https://www.cachesleuth.com/fiveneedletelegraph.html
// function getWrappedGrid(d) {
//   const rows = Math.ceil(flatText.value.length / d)
//   const rotated = flatText.value.slice(offset.value) + flatText.value.slice(0, offset.value)
//   const padded = rotated.padEnd(rows * d, '.')

//   const colorRotated = [
//     ...letterColorMap.value.slice(offset.value),
//     ...letterColorMap.value.slice(0, offset.value),
//   ]
//   const colorPadded = [...colorRotated, ...Array.from({ length: rows * d - colorRotated.length }).fill('#ffffff')]

//   const grid = []
//   for (let r = 0; r < rows; r++) {
//     const row = []
//     for (let c = 0; c < d; c++) {
//       const idx = r + c * rows
//       const bgColor = letterHighlights.value[padded[idx]?.toUpperCase()] || colorPadded[idx]
//       row.push({ char: padded[idx], color: bgColor, row: r, col: c })
//     }
//     grid.push(row)
//   }

//   let finalGrid = [...grid]
//   if (reverseRows.value) {
//     finalGrid = finalGrid.map(row => row.reverse())
//   }
//   if (reverseColumns.value) {
//     finalGrid = finalGrid.reverse()
//   }
//   return finalGrid
// }

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
const highlightColor = ref('#ffff00')
const letterHighlights = useStorage('letterHighlights', {})

function toggleLetterHighlight(letter) {
  if (letterHighlights.value[letter]) {
    delete letterHighlights.value[letter]
  }
  else {
    letterHighlights.value[letter] = highlightColor.value
  }
}

function clearLetterHighlights() {
  letterHighlights.value = {}
}
const partialHits = computed(() => {
  const outputString = wrappedGrid.value
    .map(row => row.map(cell => cell.char).join(''))
    .join('')
  const cleanedString = outputString.replace(/\./g, '').toLowerCase()
  const hits = partialWordScan(cleanedString, dictionarySet, 3)
  return hits.length > 0 ? hits : 'No partial word hits'
})

const wordScanHits = computed(() => {
  const outputString = wrappedGrid.value
    .map(row => row.map(cell => cell.char).join(''))
    .join('')
  const cleanedString = outputString.replace(/\./g, '').toLowerCase()
  displayText.value = cleanedString
  const hits = wordScan(cleanedString, dictionarySet)
  return hits.length > 0 ? hits : 'No word hits'
})

function partialWordScan(str, dictionarySet, minMatchLength = 3) {
  const hits = []
  const n = str.length

  for (let i = 0; i < n; i++) {
    for (let word of dictionarySet) {
      const wordLower = word.toLowerCase()
      for (let len = wordLower.length; len >= minMatchLength; len--) {
        if (i + len <= n) {
          const substring = str.substring(i, i + len)
          if (wordLower.includes(substring)) {
            hits.push({ word, partial: substring, position: i })
          }
        }
      }
    }
  }
  return hits
}

const letterFrequencies = computed(() => {
  const freq = {}
  for (const row of orientedGrid.value) {
    for (const ch of row) {
      if (/^[A-Z]$/i.test(ch)) {
        const uc = ch.toUpperCase()
        freq[uc] = (freq[uc] || 0) + 1
      }
    }
  }
  return Object.fromEntries(Object.entries(freq).sort((a, b) => b[1] - a[1]))
})

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

function moveUp(index) {
  if (index > 0) {
    swap(wordInputs.value, index, index - 1)
  }
}

function moveDown(index) {
  if (index < wordInputs.value.length - 1) {
    swap(wordInputs.value, index, index + 1)
  }
}

// Updated handleCellClick to allow multiple word trails
const hiddenDiameters = ref(new Set([1]))
const trails = useStorage('trails', {})
const currentDiameter = ref(null)
const trailInputs = ref({})
function addTrailInput(d) {
  if (!trailInputs.value[d]) {
    trailInputs.value[d] = []
  }
  trailInputs.value[d].push({ name: '', color: '#ddd580' })
}

function toggleDiameterVisibility(d) {
  if (hiddenDiameters.value.has(d)) {
    hiddenDiameters.value.delete(d)
  }
  else {
    hiddenDiameters.value.add(d)
  }
}

function handleCellClick(cell) {
  const selKey = `${cell.row}-${cell.col}`
  const i = selectedCells.value.findIndex(c => c.key === selKey)
  if (i === -1) {
    selectedCells.value.push({ ...cell, key: selKey, order: selectedCells.value.length + 1 })
  }
  else {
    selectedCells.value.splice(i, 1)
    selectedCells.value.forEach((c, idx) => { c.order = idx + 1 })
  }
}

const transpositionRows = computed(() => {
  const text = flatText.value.padEnd(Math.ceil(flatText.value.length / tineLength.value) * tineLength.value, '.')
  const rows = []
  for (let i = 0; i < text.length; i += tineLength.value) {
    rows.push(text.slice(i, i + tineLength.value).split(''))
  }
  return rows
})
</script>

<template>
  <!--
    This example requires updating your template:

    ```
    <html class="h-full bg-white">
    <body class="h-full">
    ```
  -->
  <div :class="printMode ? 'bg-white text-black' : ''">
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild
          as="template" enter="transition-opacity ease-linear duration-300" enter-from="opacity-0"
          enter-to="opacity-100" leave="transition-opacity ease-linear duration-300" leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-900/80"></div>
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template" enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full" enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform" leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="relative flex flex-1 w-full max-w-xs mr-16">
              <TransitionChild
                as="template" enter="ease-in-out duration-300" enter-from="opacity-0"
                enter-to="opacity-100" leave="ease-in-out duration-300" leave-from="opacity-100" leave-to="opacity-0"
              >
                <div class="absolute top-0 flex justify-center w-16 pt-5 left-full">
                  <button type="button" class="-m-2.5 p-2.5" @click="sidebarOpen = false">
                    <span class="sr-only">Close sidebar</span>
                    <XMarkIcon class="text-white size-6" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>

              <div class="flex flex-col px-6 pb-2 overflow-y-auto bg-gray-900 grow gap-y-5 ring-1 ring-white/10">
                <div class="flex items-center h-16 shrink-0">
                  <img
                    class="w-auto h-8"
                    src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                    alt="Your Company"
                  />
                </div>
                <nav class="flex flex-col flex-1">
                  <ul role="list" class="flex-1 -mx-2 space-y-1">
                    <li v-for="item in navigation" :key="item.name">
                      <a
                        :href="item.href" class="flex p-2 font-semibold rounded-md group gap-x-3 text-sm/6"
                        :class="[item.current ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white']"
                      >
                        <component :is="item.icon" class="size-6 shrink-0" aria-hidden="true" />
                        {{ item.name }}
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Static sidebar for desktop -->
    <div
      class="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-20 lg:overflow-y-auto lg:bg-gray-900 lg:pb-4"
    >
      <div class="flex items-center justify-center h-16 shrink-0">
        <img
          class="w-auto h-8" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
          alt="Your Company"
        />
      </div>
      <nav class="mt-8">
        <ul role="list" class="flex flex-col items-center space-y-1">
          <li v-for="item in navigation" :key="item.name">
            <a
              :href="item.href" class="flex p-3 font-semibold rounded-md group gap-x-3 text-sm/6"
              :class="[item.current ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white']"
            >
              <component :is="item.icon" class="size-6 shrink-0" aria-hidden="true" />
              <span class="sr-only">{{ item.name }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <div class="sticky top-0 z-40 flex items-center px-4 py-4 bg-gray-900 shadow-sm gap-x-6 sm:px-6 lg:hidden">
      <button type="button" class="-m-2.5 p-2.5 text-gray-400 lg:hidden" @click="sidebarOpen = true">
        <span class="sr-only">Open sidebar</span>
        <Bars3Icon class="size-6" aria-hidden="true" />
      </button>
      <div class="flex-1 font-semibold text-white text-sm/6">
        Dashboard
      </div>
      <a href="#">
        <span class="sr-only">Your profile</span>
        <img
          class="bg-gray-800 rounded-full size-8"
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt=""
        />
      </a>
    </div>

    <main class="lg:pl-20">
      <div class="xl:pl-96">
        <div class="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
          <div class="lg:flex lg:items-center lg:justify-between">
            <div class="flex-1 min-w-0">
              <h2 class="font-bold text-gray-900 text-2xl/7 sm:truncate sm:text-3xl sm:tracking-tight">
                Kryptos Copperplate
              </h2>
            </div>
            <div class="flex mt-5 lg:ml-4 lg:mt-0">
              <!-- Dropdown -->
              <Menu as="div" class="relative ml-3 sm:hidden">
                <MenuButton
                  class="inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-gray-300 hover:ring-gray-400"
                >
                  More
                  <ChevronDownIcon class="-mr-1 ml-1.5 size-5 text-gray-400" aria-hidden="true" />
                </MenuButton>

                <transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <MenuItems
                    class="absolute left-0 z-10 w-24 py-1 mt-2 -mr-1 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none"
                  >
                    <MenuItem v-slot="{ active }">
                      <a
                        href="#" class="block px-4 py-2 text-sm text-gray-700"
                        :class="[active ? 'bg-gray-100 outline-none' : '']"
                      >Edit</a>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <a
                        href="#" class="block px-4 py-2 text-sm text-gray-700"
                        :class="[active ? 'bg-gray-100 outline-none' : '']"
                      >View</a>
                    </MenuItem>
                  </MenuItems>
                </transition>
              </Menu>
            </div>
          </div>
          <div class="mb-6 min-w-2/5">
            <div class="mb-1 font-bold text-green-400">
              Static Grid
            </div>
            <div
              class="relative text-lg bg-gray-900 border shadow-inner scanlines font-kryptos text-lime-300 min-w-2/5 border-primary"
            >
              <div>
                <div v-for="(row, rIdx) in orientedGrid" :key="`row-${rIdx}`" class="flex">
                  <!-- left-edge bark marker gutter -->
                  <span
                    class="w-3 mr-1 text-right select-none"
                    :style="{
                      color: barkMarkerRows.has(rIdx) ? (printMode ? '#000' : '#f59e0b') : 'transparent',
                    }"
                    title="Bark mark"
                  >
                    ●
                  </span>
                  <span
                    v-for="(ch, cIdx) in row" :key="`c-${cIdx}`" class="px-1 cursor-pointer select-none" :style="{
                      color: findHighlightKeys.has(`${rIdx}-${cIdx}`) ? '#000' : (letterHighlights[ch?.toUpperCase()] ? '#000' : '#a7f3d0'),
                      backgroundColor: findHighlightKeys.has(`${rIdx}-${cIdx}`) ? findColor : (letterHighlights[ch?.toUpperCase()] || 'transparent'),
                      border: printMode ? '1px solid #ddd' : '1px solid transparent',
                    }" @click="handleCellClick({ char: ch, row: rIdx, col: cIdx })"
                  >
                    {{ ch }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <aside
      class="fixed inset-y-0 hidden px-4 py-6 overflow-y-auto border-r border-gray-200 topo left-20 w-96 sm:px-6 lg:px-8 xl:block"
    >
      <div>
        <div class="grid grid-cols-1 sm:hidden">
          <!-- Use an "onChange" listener to redirect the user to the selected tab URL. -->
          <select
            aria-label="Select a tab"
            class="w-full col-start-1 row-start-1 py-2 pl-3 pr-8 text-base text-gray-900 bg-white rounded-md appearance-none outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
          >
            <option v-for="tab in tabs" :key="tab.name" :selected="tab.current">
              {{ tab.name }}
            </option>
          </select>
          <ChevronDownIcon
            class="self-center col-start-1 row-start-1 mr-2 pointer-events-none size-5 justify-self-end fill-gray-500"
            aria-hidden="true"
          />
        </div>
        <div class="hidden sm:block">
          <nav class="flex space-x-4" aria-label="Tabs">
            <a
              v-for="tab in tabs" :key="tab.name" href="#" class="px-3 py-2 text-sm font-medium rounded-md"
              :class="[tab.current ? 'text-green-700 uppercase underline' : 'text-gray-500 hover:text-gray-700 hover:uppercase']"
              :aria-current="tab.current ? 'page' : undefined" @click.prevent="setActiveTab(tab.name)"
            >
              {{ tab.name }}
            </a>
          </nav>
          <div v-if="tabs[0].current">
            <div class="flex flex-col mt-1 sm:mt-0 ">
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
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <label class="font-semibold">Orientation:</label>
                <label><input v-model="gridOrientation" type="radio" value="normal" /> Normal</label>
                <label><input v-model="gridOrientation" type="radio" value="tree" /> TREE (first column → first
                  row)</label>
                <label><input v-model="gridOrientation" type="radio" value="roots" /> ROOTS (right edge → top)</label>
                <label class="ml-4"><input v-model="printMode" type="checkbox" /> Print-Friendly</label>
              </div>
            </div>
            <div class="p-1 border border-primary">
              <h2 class="mb-2 text-lg">
                Highlight letters
              </h2>
              <div class="mb-4">
                <label class="mr-2 text-sm">Highlight Color:</label>
                <input v-model="highlightColor" type="color" class="mr-4" />
                <button class="px-2 py-1 text-sm " @click="clearLetterHighlights">
                  Clear
                </button>
              </div>
              <div class="flex flex-wrap gap-1 mb-4 text-black">
                <button
                  v-for="letter in alphabet" :key="letter" class="w-8 h-8 font-bold border rounded font-kryptos"
                  :class="{ 'bg-gray-300': letterHighlights[letter] }" @click="toggleLetterHighlight(letter)"
                >
                  {{ letter }}
                </button>
              </div>
            </div>
            <div class="p-1 mt-2 border border-primary">
              <h2 class="mb-2 text-lg">
                Find Word
              </h2>
              <div class="flex flex-wrap items-center gap-3 mb-2 text-sm">
                <input
                  v-model="findQuery" placeholder="search…"
                  class="p-1 text-black border border-gray-400 rounded"
                />
                <label>Mode
                  <select v-model="findMode" class="ml-1 text-black">
                    <option value="rows">Rows</option>
                    <option value="cols">Columns</option>
                    <option value="diagDown">Diag ↓→ (wrap)</option>
                    <option value="diagUp">Diag ↑→ (wrap)</option>
                    <option value="all">All (8 dirs)</option>
                  </select>
                </label>
                <label class="ml-2"><input v-model="findWrap" type="checkbox" /> Wrap</label>
                <label class="ml-2"><input v-model="findBackwards" type="checkbox" /> Backwards</label>
                <label class="ml-2">Color <input v-model="findColor" type="color" class="ml-1" /></label>
                <button class="px-2 py-1 text-sm" @click="findQuery = ''">
                  Clear
                </button>
              </div>
              <div class="text-xs text-gray-400">
                Matches: {{ findMatches.length }}
              </div>
            </div>
            <div class="p-1 border border-primary">
              <h2 class="mb-2 text-lg">
                Letter Frequency:
              </h2>
              <div
                v-for="(count, letter) in letterFrequencies" :key="letter"
                class="flex justify-between text-sm text-black bg-white px-2 py-0.5 border border-gray-300 mb-0.5 font-kryptos"
              >
                <span>{{ letter }}</span>
                <span class="font-base">{{ count }}</span>
              </div>
            </div>
            <div class="p-1 mt-2 border border-primary">
              <h2 class="mb-2 text-lg">
                Selection Tracker
              </h2>
              <div class="flex flex-wrap gap-2 mb-2">
                <button class="px-2 py-1 text-sm" @click="selectedCells = []">
                  Clear
                </button>
                <button class="px-2 py-1 text-sm" @click="selectedCells.pop()">
                  Remove Last
                </button>
                <button class="px-2 py-1 text-sm" @click="copySelectedPath">
                  Copy Path
                </button>
                <button class="px-2 py-1 text-sm" @click="copyRowSpan">
                  Copy Row Span (first↔last)
                </button>
                <button class="px-2 py-1 text-sm" @click="copyColSpan">
                  Copy Col Span (first↕last)
                </button>
                <button class="px-2 py-1 text-sm" @click="sendSelectionToDMS('path')">
                  Send Path → DMS
                </button>
                <button class="px-2 py-1 text-sm" @click="sendSelectionToDMS('row')">
                  Send Row Span → DMS
                </button>
                <button class="px-2 py-1 text-sm" @click="sendSelectionToDMS('col')">
                  Send Col Span → DMS
                </button>
                <button class="px-2 py-1 text-sm" @click="copyRowsBetween">
                  Copy Rows Between (full rows)
                </button>
                <button class="px-2 py-1 text-sm" @click="sendRowsBetweenToDMS">
                  Send Rows Between → DMS
                </button>
              </div>
              <textarea
                :value="selectedCells.map(c => `${c.char} (r${c.row},c${c.col}) #${c.order}`).join('\n')"
                rows="6" class="w-full p-2 font-mono text-black"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
  <!-- old -->
  <!-- <div class="flex flex-col min-h-screen p-8 text-white bg-gray-900">
    <div class="mb-4">
      <label><input v-model="useExtendedWords" type="checkbox" /> Use E-enhanced word set</label>
    </div>

    <div class="flex gap-8 mb-4">
      <div>
        <label>Diameter:</label>
        <input v-model="diameter" type="number" class="w-20 p-1 ml-2 text-black" />
      </div>

      <div>
        <label>Offset:</label>
        <input v-model="offset" type="number" class="w-20 p-1 ml-2 text-black" />
      </div>
      <div>
        <button class="px-4 py-2 mb-4 bg-green-600 rounded" @click="fullDiameterSweep">
          Run Diameter Sweep
        </button>
      </div>
    </div>
    <div class="mb-4">
      <label>Input Text:</label>
      <pre>{{ displayText }}</pre>
    </div>

    <div class="flex gap-4 mb-4">
      <div>
        <label><input v-model="reverseRows" type="checkbox" /> Reverse Rows</label>
      </div>
      <div>
        <label><input v-model="reverseColumns" type="checkbox" /> Reverse Columns</label>
      </div>
    </div>
    <div class="flex flex-wrap gap-4 align-top ">
      <div v-for="d in Array.from({ length: 28 }, (_, i) => i + 1).filter(d => d > 1 && !hiddenDiameters.has(d))"
        :key="d" class="mb-6 min-w-2/5">
        <div class="flex items-center justify-between">
          <h3 class="mb-2 text-xl">
            Diameter {{ d }}
          </h3>
          <button class="text-sm text-red-300 underline" @click="() => toggleDiameterVisibility(d)">
            Hide
          </button>
        </div>
        <div class="flex gap-2 mb-2">
          <input v-model="currentTrailName" placeholder="Word name" class="p-1 text-black"
            @focus="currentDiameter = d" />
          <input v-model="currentTrailColor" type="color" />
        </div>
        <div class="font-mono text-lg border min-w-2/5 border-primary">
          <div v-for="(row, rowIdx) in getWrappedGrid(d)" :key="`row-${d}-${rowIdx}`" class="flex" :d="d">
            <span v-for="(cell, cidx) in row" :key="cidx" class="px-1 cursor-pointer" :style="{
                color: cell.color,
                      backgroundColor: Object.values(trails)
                        .filter(t => t.cells.some(c => c.key === `${cell.row}-${cell.col}-${d}`))
                        .map(t => t.color || '#ddd580')[0] || 'transparent',
                border: '1px solid transparent',
              }" @click="handleCellClick({ ...cell, diameter: d })">
              {{ cell.char }}
            </span>
          </div>
        </div>
      </div> -->
  <!-- <div class="p-4 mt-8 border border-primary">
        <h3 class="mb-2 text-xl">
          Rail Reading Details
        </h3>
        <div class="p-4">
          <div class="flex flex-wrap gap-2 text-xl">
            <div v-for="(cell, idx) in selectedCells" :key="cell.key"
              class="px-2 py-1 text-black bg-white border border-gray-600 rounded">
              {{ cell.char }} ({{ cell.row }},{{ cell.col }}) #{{ cell.order }}
            </div>
          </div>
        </div>
      </div> -->
  <!-- <div class="p-4 mt-8 border border-primary">
        <h3 class="mb-2 text-xl">
          Transposition Grid
        </h3>
        <div class="mb-4">
          <label for="tineLengthInput">Transposition Shift Length:</label>
          <input id="tineLengthInput" v-model="tineLength" type="number" class="w-20 p-1 ml-2 text-black" min="1" />
        </div>
        <div class="font-mono text-2xl border min-w-[33%] border-primary">
          <div v-for="(row, idx) in transpositionRows" :key="idx" class="flex">
            <span v-for="(char, cidx) in row" :key="cidx" class="px-2 py-1 text-white">
              {{ char }}
            </span>
          </div>
        </div>
      </div> -->
  <!-- <div class="p-4 border border-primary">
        <h2 class="mb-2 text-lg">
          Word Stack Order:
        </h2>
        <div v-for="(word, index) in wordInputs" :key="index" class="flex items-center gap-2 mb-1">
          <div class="w-32 p-1 text-black bg-white">
            {{ word }}
          </div>
          <button :disabled="index === 0" class="px-2 bg-blue-600 rounded" @click="() => moveUp(index)">
            ↑
          </button>
          <button :disabled="index === wordInputs.length - 1" class="px-2 bg-blue-600 rounded"
            @click="() => moveDown(index)">
            ↓
          </button>
        </div>
      </div> -->
  <!-- </div>
  </div> -->
</template>
