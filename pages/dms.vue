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

const STATIC_GRID_TEXT = ref('') // optional pasted multi-line grid for orientation

const inputMode = ref('wordlist') // 'wordlist' | 'freetext' | 'morse'
const freeText = ref('')
const morseInput = ref('')
const morseDot = ref('.')
const morseDash = ref('-')
const morseMapStyle = ref('12') // '12' (dot→1 dash→2) or '01' (dot→0 dash→1)
const scytaleMode = ref(false)

const printMode = ref(false)

// leave empty; we'll seed from hidden textarea if present
const seedTA = ref(null)
onMounted(() => {
  // URL param seed takes precedence
  const params = new URLSearchParams(window.location.search)
  const qText = params.get('text') || params.get('freetext')
  const qMode = params.get('inputMode')
  if (qText) {
    inputMode.value = (qMode === 'morse' || qMode === 'wordlist') ? qMode : 'freetext'
    freeText.value = qText.trim()
    scytaleMode.value = true
  }
  else if (!freeText.value && seedTA.value) {
    const val = seedTA.value.value || ''
    freeText.value = val.trim()
  }
})

// Orientation support for static grid
const gridOrientation = ref('normal') // 'normal' | 'tree' | 'roots'

function parseGridText(s) {
  const rows = s.split(/\r?\n/).map(r => r.trim()).filter(Boolean)
  if (!rows.length)
    return []
  return rows.map(r => r.split('')) // no padding, ragged rows preserved
}
function rotateGridCW(grid) {
  if (!grid.length)
    return []
  const R = grid.length
  const Cmax = Math.max(...grid.map(r => r.length))
  const out = []
  for (let c = 0; c < Cmax; c++) {
    const row = []
    for (let r = R - 1; r >= 0; r--) {
      const ch = grid[r][c]
      if (ch !== undefined)
        row.push(ch)
    }
    if (row.length)
      out.push(row)
  }
  return out
}

function rotateGridCCW(grid) {
  if (!grid.length)
    return []
  const R = grid.length
  const Cmax = Math.max(...grid.map(r => r.length))
  const out = []
  for (let c = Cmax - 1; c >= 0; c--) {
    const row = []
    for (let r = 0; r < R; r++) {
      const ch = grid[r][c]
      if (ch !== undefined)
        row.push(ch)
    }
    if (row.length)
      out.push(row)
  }
  return out
}

// Helper to apply grid orientation consistently (TREE/ROOTS/normal)
function applyOrientation(grid) {
  if (!grid || !grid.length)
    return grid
  // Keep mapping consistent with copperplate.vue:
  // TREE: first column → first row (clockwise rotation)
  // ROOTS: right edge → top (counter‑clockwise rotation)
  if (gridOrientation.value === 'tree')
    return rotateGridCW(grid)
  if (gridOrientation.value === 'roots')
    return rotateGridCCW(grid)
  return grid
}

// Build the base string with TREE/ROOTS applied to a pasted rectangular grid,
// keeping orientation OUTSIDE of scytale so letter order feeds scytale unchanged.
function getOrientedSourceString() {
  const ori = gridOrientation.value
  if (ori === 'normal') {
    return flatText.value
  }
  // Prefer STATIC_GRID_TEXT (multi-line) if present; else try freeText (multi-line)
  const src = (STATIC_GRID_TEXT.value && STATIC_GRID_TEXT.value.includes('\n'))
    ? STATIC_GRID_TEXT.value
    : (freeText.value && freeText.value.includes('\n') ? freeText.value : '')
  if (!src) {
    // No multi-line grid to rotate; fall back to flatText without rotation
    return flatText.value
  }
  const grid = parseGridText(src)
  let rotated
  if (ori === 'tree')
    rotated = rotateGridCW(grid) // clockwise
  else if (ori === 'roots')
    rotated = rotateGridCCW(grid) // counter-clockwise
  else rotated = grid
  return rotated.map(r => r.join('')).join('')
}

const parsedGrid = computed(() => parseGridText(STATIC_GRID_TEXT.value))
const orientedGrid = computed(() => {
  let g = parsedGrid.value
  if (gridOrientation.value === 'tree')
    return rotateGridCW(g) // first column -> first row
  if (gridOrientation.value === 'roots')
    return rotateGridCCW(g) // right edge -> top
  return g
})

// DMS parameters
const latDeg = ref(38)
const latMin = ref(57)
const latSec = ref(6.5)
const latHemi = ref('N') // 'N'|'S'
const lonDeg = ref(77)
const lonMin = ref(8)
const lonSec = ref(44)
const lonHemi = ref('W') // 'E'|'W'

// Apply target for DMS-driven options: static pasted grid vs scytale-wrapped strip
const dmsApplyTarget = ref('static') // 'static' | 'scytale'

const tabs = ref([
  { name: 'Word List', href: '#', current: true },
  { name: 'Trail Trace', href: '#', current: false },
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

// --- Full Word Search (8 directions, wrap, backward) for Scytale Mode ---
const findQuery = ref('')
const findMode = ref('all') // 'rows' | 'cols' | 'diagDown' | 'diagUp' | 'all'
const findWrap = ref(true)
const findBackwards = ref(true)
const findColor = ref('#ffd54f')
const findDiameter = ref(16) // which diameter grid to search/highlight in Scytale mode

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
function findAll(haystack, needle) {
  const hits = []; if (!needle)
    return hits
  const h = haystack.toLowerCase(); const n = needle.toLowerCase()
  let idx = 0
  while (true) {
    idx = h.indexOf(n, idx); if (idx === -1)
      break; hits.push(idx); idx += 1
  }
  return hits
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
function getPlainGridForDiameter(d) {
  const withE = !!useExtendedWords.value
  const gridCells = getWrappedGrid(d, withE)
  return gridCells.map(row => row.map(cell => cell.char))
}
const findMatches = computed(() => {
  const q = findQuery.value.trim()
  if (!q)
    return []
  // Only search in Scytale mode and against the chosen diameter grid
  const d = Math.max(2, Number(findDiameter.value) || 2)
  const g = getPlainGridForDiameter(d)
  if (!g.length)
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
  // decorate each hit with diameter for highlighting
  return out.map(cells => ({ d, cells }))
})

const findHighlightKeys = computed(() => {
  const set = new Set()
  for (const hit of findMatches.value) {
    const d = hit.d
    for (const [r, c] of hit.cells) set.add(`${r}-${c}-${d}`)
  }
  return set
})

function getWrappedGrid(d, useExtended = useExtendedWords.value) {
  let flat
  if (inputMode.value === 'wordlist') {
    flat = (useExtended ? wordInputsWithE.value : wordInputs.value).join('')
  }
  else {
    // Apply TREE/ROOTS to a pasted grid BEFORE scytale; otherwise use the raw flat text
    flat = getOrientedSourceString()
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
  // Do not apply applyOrientation here
  return finalGrid
}

// --- DMS/scytale helpers ---
function rotateStringLocal(s, o) {
  if (!s.length)
    return s; o = ((o % s.length) + s.length) % s.length; return s.slice(o) + s.slice(0, o)
}
function buildScytaleGridFromStrip(strip, cols, offsetLocal = 0, reverseRowsLocal = false, reverseColsLocal = false) {
  const N = strip.length
  const R = Math.ceil(N / cols)
  const rotated = rotateStringLocal(strip, offsetLocal)
  const padded = rotated.padEnd(R * cols, '.')
  const grid = []
  for (let r = 0; r < R; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      const idx = r + c * R
      row.push(padded[idx])
    }
    grid.push(row)
  }
  let g = grid
  if (reverseRowsLocal)
    g = g.map(row => row.slice().reverse())
  if (reverseColsLocal)
    g = g.slice().reverse()
  return g
}

// Utility readers (plain, not colored)
function readColsPlain(grid) {
  if (!grid.length)
    return ''; const R = grid.length; const C = grid[0].length; let out = ''; for (let c = 0; c < C; c++) {
    for (let r = 0; r < R; r++) out += grid[r][c]
  } return out
}
function readRowsPlain(grid) { return grid.map(r => r.join('')).join('') }
function readDiagDownPlain(grid) {
  if (!grid.length)
    return ''; const R = grid.length; const C = grid[0].length; let out = ''; for (let sc = 0; sc < C; sc++) { let r = 0; let c = sc; while (r < R) { out += grid[r][c]; r++; c = (c + 1) % C } } return out
}
function readDiagUpPlain(grid) {
  if (!grid.length)
    return ''; const R = grid.length; const C = grid[0].length; let out = ''; for (let sc = 0; sc < C; sc++) { let r = R - 1; let c = sc; while (r >= 0) { out += grid[r][c]; r--; c = (c + 1) % C } } return out
}

// Grid selection for DMS options
function getStaticGrid() { return orientedUserGrid.value }
function getScytaleGridFor(cols, offsetLocal, reverseByWest) {
  const strip = getOrientedSourceString()
  const reverseColsLocal = false
  const reverseRowsLocal = false
  const revStrip = (reverseByWest ? strip.split('').reverse().join('') : strip)
  const base = buildScytaleGridFromStrip(revStrip, Math.max(1, cols), Math.floor(offsetLocal) || 0, reverseRowsLocal, reverseColsLocal)
  return base
}
function getGridForOption(cols, offsetLocal, reverseByWest) {
  if (dmsApplyTarget.value === 'scytale')
    return getScytaleGridFor(cols, offsetLocal, reverseByWest)
  return getStaticGrid()
}

function buildRowStrings(grid) {
  return grid.map(row => row.join(''))
}
function buildColStrings(grid) {
  if (!grid.length)
    return []
  const R = grid.length; const Cmax = Math.max(...grid.map(r => r.length))
  const cols = Array.from({ length: Cmax }, () => [])
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < Cmax; c++) {
      const ch = grid[r][c]
      if (ch !== undefined)
        cols[c].push(ch)
    }
  }
  return cols.map(col => col.join(''))
}

function buildDiagDownStrings(grid) { // ↘ wrap across Cmax
  if (!grid.length)
    return []
  const R = grid.length; const Cmax = Math.max(...grid.map(r => r.length))
  const diags = []
  for (let sc = 0; sc < Cmax; sc++) {
    let s = ''; let r = 0; let c = sc; let steps = 0
    while (steps < R) {
      const ch = grid[r][c]
      if (ch !== undefined)
        s += ch
      r++; c = (c + 1) % Cmax; steps++
    }
    diags.push(s)
  }
  return diags
}

function buildDiagUpStrings(grid) { // ↗ wrap across Cmax
  if (!grid.length)
    return []
  const R = grid.length; const Cmax = Math.max(...grid.map(r => r.length))
  const diags = []
  for (let sc = 0; sc < Cmax; sc++) {
    let s = ''; let r = R - 1; let c = sc; let steps = 0
    while (steps < R) {
      const ch = grid[r][c]
      if (ch !== undefined)
        s += ch
      r--; c = (c + 1) % Cmax; steps++
    }
    diags.push(s)
  }
  return diags
}

// --- DMS Option A–F logic ---
function clampWrap(val, mod) { return ((val % mod) + mod) % mod }

function runRoute(grid, startRow, startCol, legs) {
  if (!grid.length)
    return { path: [], text: '' }
  const R = grid.length; const C = grid[0].length
  let r = clampWrap(startRow, R); let c = clampWrap(startCol, C)
  const chars = []
  const path = []
  for (const leg of legs) {
    const { steps, dr, dc } = leg
    for (let k = 0; k < steps; k++) {
      path.push([r, c])
      chars.push(grid[r][c])
      r = clampWrap(r + dr, R)
      c = clampWrap(c + dc, C)
    }
  }
  return { path, text: chars.join('') }
}

const dmsParams = computed(() => ({
  lat: { deg: +latDeg.value, min: +latMin.value, sec: +latSec.value, hemi: latHemi.value },
  lon: { deg: +lonDeg.value, min: +lonMin.value, sec: +lonSec.value, hemi: lonHemi.value },
}))

// Option A
const optA = computed(() => {
  const { lat, lon } = dmsParams.value
  const C = Math.max(1, lon.deg)
  const offsetLocal = lat.min
  const reverseByWest = (lon.hemi === 'W')
  const grid = getGridForOption(C, offsetLocal, reverseByWest)
  if (!grid.length)
    return { C, offset: offsetLocal, text: '', note: 'no grid' }
  // start from (3,8) 1-based → 0-based
  let row0 = 3 - 1; let col0 = 8 - 1
  // legs: 57 N, 6 diag NW (ignore .5 fractional), 77 W, 8 N, 44 W
  const legs = [
    { steps: lat.min, dr: -1, dc: 0 },
    { steps: Math.floor(lat.sec), dr: -1, dc: -1 },
    { steps: lon.deg, dr: 0, dc: -1 },
    { steps: lon.min, dr: -1, dc: 0 },
    { steps: lon.sec, dr: 0, dc: -1 },
  ]
  const { text } = runRoute(grid, row0, col0, legs)
  return { C, offset: offsetLocal, text }
})

// Option C (column band selection)
const optC = computed(() => {
  const { lat, lon } = dmsParams.value
  const C = Math.max(1, lon.deg)
  const offsetLocal = 0
  const reverseByWest = false
  const grid = getGridForOption(C, offsetLocal, reverseByWest)
  if (!grid.length)
    return { C, band: '', text: '' }
  const R = grid.length; const Cols = grid[0].length
  const cStart = Math.max(0, Math.min(Cols - 1, Math.min(Math.floor(lat.deg / 10), (lat.deg % 10)) - 1 + 1)) // prefer 3 from 38
  const c0 = Math.max(0, (Math.floor(lat.deg / 10) || 0))
  const c1 = Math.min(Cols - 1, c0 + Math.max(4, Math.min(6, Math.floor(lat.min / 10))))
  const out = []
  for (let c = c0; c <= c1; c++) {
    for (let r = 0; r < R; r++) out.push(grid[r][c])
  }
  return { C, band: `${c0 + 1}..${c1 + 1}`, text: out.join('') }
})

// Option D (C from lon°, offset from lat′, reverse if W; read columns if N else rows)
const optD = computed(() => {
  const { lat, lon } = dmsParams.value
  const C = Math.max(1, lon.deg)
  const offsetLocal = lat.min
  const reverseByWest = (lon.hemi === 'W')
  const grid = getGridForOption(C, offsetLocal, reverseByWest)
  if (!grid.length)
    return { C, offset: offsetLocal, text: '' }
  const text = (lat.hemi === 'N') ? readColsPlain(grid) : readRowsPlain(grid)
  return { C, offset: offsetLocal, text }
})

// Option E (Cardan mask)
const optE = computed(() => {
  const { lat, lon } = dmsParams.value
  const C = Math.max(1, lon.deg)
  const grid = getGridForOption(C, 0, false)
  if (!grid.length)
    return { C, text: '' }
  const R = grid.length; const Cols = grid[0].length
  const maskCols = [Math.floor(lat.deg / 10), lat.deg % 10].map(x => Math.max(1, x) || 1).map(x => Math.min(Cols, x))
  const maskRows = [Math.floor(lat.min / 10), lat.min % 10].map(x => Math.max(1, x) || 1).map(x => Math.min(R, x))
  const includeDiag = (Math.floor(lat.sec) % 2) === 1
  const cells = new Set()
  for (const mc of maskCols) {
    for (const mr of maskRows) {
      cells.add(`${mr - 1},${mc - 1}`)
      if (includeDiag) {
        const r0 = mr - 1; const c0 = mc - 1
        const neighbors = [[r0 - 1, c0 - 1], [r0 - 1, c0 + 1], [r0 + 1, c0 - 1], [r0 + 1, c0 + 1]]
        for (const [rr, cc] of neighbors) {
          if (rr >= 0 && rr < R && cc >= 0 && cc < Cols)
            cells.add(`${rr},${cc}`)
        }
      }
    }
  }
  const picked = []
  for (let c = 0; c < Cols; c++) {
    for (let r = 0; r < R; r++) {
      if (cells.has(`${r},${c}`))
        picked.push(grid[r][c])
    }
  }
  return { C, mask: { rows: maskRows, cols: maskCols, includeDiag }, text: picked.join('') }
})

// Option F (start/end markers path along columns)
const optF = computed(() => {
  const { lat, lon } = dmsParams.value
  const C = Math.max(1, lon.deg)
  const grid = getGridForOption(C, 0, false)
  if (!grid.length)
    return { C, text: '' }
  const R = grid.length; const Cols = grid[0].length
  const start = [3 - 1, 8 - 1]
  const end = [5 - 1, 7 - 1]
  // Walk horizontally (columns) shortest wrap from start to end, sampling along the way; then walk rows if needed
  let [r, c] = start
  const chars = []
  let steps = 0
  while (c !== end[1] && steps < Cols * 2) { chars.push(grid[r][c]); c = (c + 1) % Cols; steps++ }
  steps = 0
  while (r !== end[0] && steps < R * 2) { chars.push(grid[r][c]); r = (r + 1) % R; steps++ }
  chars.push(grid[r][c])
  return { C, text: chars.join('') }
})

// Oriented user grid for static grid (for DMS options)
const orientedUserGrid = computed(() => {
  // Use the "static" grid: built from input, offset, reverseRows/Cols
  const flat = getOrientedSourceString()
  const d = diameter.value
  const rows = Math.ceil(flat.length / d)
  const rotated = flat.slice(offset.value) + flat.slice(0, offset.value)
  const padded = rotated.padEnd(rows * d, '.')
  const grid = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < d; c++) {
      const idx = r + c * rows
      row.push(padded[idx])
    }
    grid.push(row)
  }
  let finalGrid = [...grid]
  if (reverseRows.value)
    finalGrid = finalGrid.map(row => row.slice().reverse())
  if (reverseColumns.value)
    finalGrid = finalGrid.slice().reverse()
  // Do not apply applyOrientation here; getOrientedSourceString already did orientation
  return finalGrid
})
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

// Letter frequencies computed property, now uses orientedUserGrid
const letterFrequencies = computed(() => {
  const freq = {}
  for (const row of orientedUserGrid.value) {
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
          <div class="lg:flex lg:items-center lg:justify-between">
            <div class="flex-1 min-w-0">
              <h2 class="font-bold text-gray-900 text-2xl/7 sm:truncate sm:text-3xl sm:tracking-tight">
                Kryptos Scytale Cipher
              </h2>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <label class="font-semibold text-white">Orientation:</label>
                <label class="text-white"><input v-model="gridOrientation" type="radio" value="normal" /> Normal</label>
                <label class="text-white"><input v-model="gridOrientation" type="radio" value="tree" /> TREE (first
                  column → first row)</label>
                <label class="text-white"><input v-model="gridOrientation" type="radio" value="roots" /> ROOTS (right
                  edge → top)</label>
              </div>
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
          <div v-if="scytaleMode">
            <Disclosure
              v-for="d in Array.from({ length: 50 }, (_, i) => i + 1).filter(d => d > 1)" :key="d" as="div"
              class="mb-6 min-w-2/5"
            >
              <DisclosureButton
                class="flex items-center justify-between w-full px-4 py-2 text-xl font-medium text-left text-gray-100 bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75"
              >
                <span>Diameter {{ d }}</span>
                <ChevronDownIcon class="w-5 h-5 text-gray-300" />
              </DisclosureButton>
              <DisclosurePanel class="px-4 pt-4 pb-2 text-sm text-gray-200">
                <div class="flex flex-col gap-4 mb-4 md:flex-row">
                  <div class="flex-1">
                    <div class="mb-1 font-bold text-green-400">
                      Without EEEs
                    </div>
                    <div
                      class="relative text-lg bg-gray-900 border shadow-inner scanlines font-kryptos text-lime-300 min-w-2/5 border-primary"
                    >
                      <template v-if="true">
                        <!-- Render grid with useExtendedWords = false -->
                        <div>
                          <div
                            v-for="(row, rowIdx) in getWrappedGrid(d, false)" :key="`row-noeee-${d}-${rowIdx}`"
                            class="flex"
                          >
                            <span
                              v-for="(cell, cidx) in row" :key="cidx" class="px-1 cursor-pointer" :style="{
                                color: cell.color,
                                backgroundColor: findHighlightKeys.has(`${cell.row}-${cell.col}-${d}`)
                                  ? findColor
                                  : (Object.values(trails)
                                    .filter(t => t.cells.some(c => c.key === `${cell.row}-${cell.col}-${d}`))
                                    .map(t => t.color)[0] || 'transparent'),
                                border: printMode ? '1px solid #ddd' : '1px solid transparent',
                              }" @click="handleCellClick({ ...cell, diameter: d })"
                            >
                              {{ cell.char }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </DisclosurePanel>
            </Disclosure>
          </div>
          <div v-else>
            <!-- DMS Option Outputs block -->
            <div class="p-2 mt-6 border border-primary">
              <h2 class="mb-2 text-lg">
                DMS Option Outputs
              </h2>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div class="text-sm">
                  <div class="font-semibold text-green-400">
                    A — C=lon°, offset=lat′, route N/NW/W/N/W
                  </div>

                  <textarea :value="optA.text" rows="4" class="w-full p-2 font-mono text-black"></textarea>

                  <div class="opacity-70">
                    C={{ optA.C }}, offset={{ optA.offset }}
                  </div>
                </div>
                <div class="text-sm">
                  <div class="font-semibold text-green-400">
                    C — Column Band (from 38→3..8)
                  </div>

                  <textarea :value="optC.text" rows="4" class="w-full p-2 font-mono text-black"></textarea>

                  <div class="opacity-70">
                    C={{ optC.C }}, band={{ optC.band }}
                  </div>
                </div>
                <div class="text-sm">
                  <div class="font-semibold text-green-400">
                    D — C=lon°, offset=lat′, reverse if W; read {{ latHemi === 'N'
                      ? 'columns' : 'rows' }}
                  </div>

                  <textarea :value="optD.text" rows="4" class="w-full p-2 font-mono text-black"></textarea>

                  <div class="opacity-70">
                    C={{ optD.C }}, offset={{ optD.offset }}
                  </div>
                </div>
                <div class="text-sm">
                  <div class="font-semibold text-green-400">
                    E — Cardan Mask (rows from 57, cols from 38)
                  </div>

                  <textarea :value="optE.text" rows="4" class="w-full p-2 font-mono text-black"></textarea>

                  <div class="opacity-70">
                    mask: rows={{ optE.mask?.rows?.join(',') }}, cols={{ optE.mask?.cols?.join(',') }}, diag={{
                      optE.mask?.includeDiag }}
                  </div>
                </div>
                <div class="text-sm md:col-span-2">
                  <div class="font-semibold text-green-400">
                    F — Start (3,8) → End (5,7) path
                  </div>

                  <textarea :value="optF.text" rows="3" class="w-full p-2 font-mono text-black"></textarea>

                  <div class="opacity-70">
                    C={{ optF.C }}
                  </div>
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
              <!-- <div class="flex flex-wrap mb-4">
              <label>Input Text:</label>
              <div class="w-full p-2 text-sm text-black uppercase break-words bg-white border border-gray-300 font-kryptos">
                {{ displayText }}
              </div>
            </div> -->
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <label class="font-semibold">Input:</label>
                <label><input v-model="inputMode" type="radio" value="wordlist" /> Word List</label>
                <label><input v-model="inputMode" type="radio" value="freetext" /> Free Text</label>
                <label><input v-model="inputMode" type="radio" value="morse" /> Morse</label>
                <label class="ml-4"><input v-model="printMode" type="checkbox" /> Print-Friendly</label>
                <label class="ml-4"><input v-model="scytaleMode" type="checkbox" /> Scytale Mode</label>
              </div>

              <div v-if="inputMode === 'freetext'" class="mt-2">
                <label class="block text-sm">Free Text Input</label>
                <textarea ref="seedTA" v-model="freeText" rows="4" class="w-full p-2 text-black uppercase font-kryptos">EMUFPHZLRFAXYUSDJKZLDKRNSHGNFIVJ
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
              </div>

              <div v-else-if="inputMode === 'morse'" class="mt-2 space-y-2">
                <div class="flex items-center gap-3">
                  <label>Dot <input v-model="morseDot" class="w-12 ml-1 text-black" /></label>
                  <label>Dash <input v-model="morseDash" class="w-12 ml-1 text-black" /></label>
                  <label>Map
                    <select v-model="morseMapStyle" class="ml-1 text-black">
                      <option value="12">dot→1 dash→2</option>
                      <option value="01">dot→0 dash→1</option>
                    </select>
                  </label>
                </div>
                <label class="block text-sm">Morse Input</label>
                <textarea v-model="morseInput" rows="4" class="w-full p-2 font-mono text-black"></textarea>
                <div class="text-xs text-gray-400">
                  Processed: {{ flatText }}
                </div>
              </div>
              <div class="flex items-center mt-2 text-sm text-gray-500">
                <label><input v-model="reverseRows" type="checkbox" /> Reverse Rows</label>
              </div>
              <div class="flex items-center mt-2 text-sm text-gray-500">
                <label><input v-model="reverseColumns" type="checkbox" /> Reverse Columns</label>
              </div>
              <div class="flex items-center mt-2 text-sm text-gray-500">
                <label><input v-model=" useExtendedWords" type="checkbox" /> Include EEEs</label>
              </div>
              <!-- <div class="flex items-center mt-2 text-sm text-gray-500">
              <label>Diameter:</label>
              <input v-model="diameter" type="number" class="w-20 p-1 ml-2 text-black" />
            </div> -->
              <div class="flex items-center mt-2 text-sm text-gray-500">
                <label>Offset:</label>
                <input v-model="offset" type="number" class="w-20 p-1 ml-2 text-black" />
              </div>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <label class="font-semibold">Orientation:</label>
                <label><input v-model="gridOrientation" type="radio" value="normal" /> Normal</label>
                <label><input v-model="gridOrientation" type="radio" value="tree" /> TREE (first column → first
                  row)</label>
                <label><input v-model="gridOrientation" type="radio" value="roots" /> ROOTS (right edge → top)</label>
              </div>

              <!-- DMS Controls Panel -->
              <div class="p-1 mt-2 border border-primary">
                <h2 class="mb-2 text-lg">
                  DMS Controls
                </h2>
                <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <div>
                    <label class="mr-1 font-semibold">Latitude</label>
                    <input v-model.number="latDeg" type="number" class="w-16 p-1 text-black" />°
                    <input v-model.number="latMin" type="number" class="w-16 p-1 text-black" />′
                    <input v-model="latSec" type="number" step="0.5" class="w-20 p-1 text-black" />″
                    <select v-model="latHemi" class="p-1 text-black">
                      <option value="N">
                        N
                      </option>
                      <option value="S">
                        S
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="mr-1 font-semibold">Longitude</label>
                    <input v-model.number="lonDeg" type="number" class="w-16 p-1 text-black" />°
                    <input v-model.number="lonMin" type="number" class="w-16 p-1 text-black" />′
                    <input v-model.number="lonSec" type="number" class="w-20 p-1 text-black" />″
                    <select v-model="lonHemi" class="p-1 text-black">
                      <option value="E">
                        E
                      </option>
                      <option value="W">
                        W
                      </option>
                    </select>
                  </div>
                </div>
                <div class="mt-2 text-sm text-gray-500">
                  <label class="mr-2">Apply to:</label>
                  <label><input v-model="dmsApplyTarget" type="radio" value="static" /> Static Grid (pasted)</label>
                  <label class="ml-3"><input v-model="dmsApplyTarget" type="radio" value="scytale" /> Scytale (columns
                    from option)</label>
                </div>
              </div>
            </div>
            <!-- Find Word Panel for Scytale Mode -->
            <div v-if="scytaleMode" class="p-1 mt-2 border border-primary">
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
                <label class="ml-2">Diameter
                  <input
                    v-model.number="findDiameter" type="number" min="2" max="40"
                    class="w-16 p-1 ml-1 text-black"
                  />
                </label>
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
            <div class="p-1 border border-primary">
              <h2 class="mb-2 text-lg">
                Word Stack Order:
              </h2>
              <div v-for="(word, index) in activeWordSet" :key="index" class="flex items-center gap-2 mb-1">
                <div class="w-56 p-1 text-sm text-black bg-white font-kryptos">
                  {{ word }}
                </div>
                <button
                  v-if="activeWordSet === wordInputs" :disabled="index === 0" class="px-2 "
                  @click="() => moveUp(index)"
                >
                  ↑
                </button>
                <button
                  v-if="activeWordSet === wordInputs" :disabled="index === wordInputs.length - 1" class="px-2 "
                  @click="() => moveDown(index)"
                >
                  ↓
                </button>
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
              <div class="flex gap-2 mb-2">
                <button class="px-2 py-1 text-sm" @click="selectedCells = []">
                  Clear
                </button>
                <button class="px-2 py-1 text-sm" @click="selectedCells.pop()">
                  Remove Last
                </button>
              </div>
              <textarea
                :value="selectedCells.map(c => `${c.char} (r${c.row},c${c.col},d${c.diameter}) #${c.order}`).join('\\n')"
                rows="6" class="w-full p-2 font-mono text-black"
              ></textarea>
            </div>
          </div>
          <div>
            <div v-if="tabs[1].current" class="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
              <!-- Trail Trace content will go here -->
              <div class="space-y-4">
                <div
                  v-for="d in Array.from({ length: 28 }, (_, i) => i + 1).filter(d => d > 1)" :key="`input-${d}`"
                  class="p-2 text-black bg-white border border-gray-300 rounded"
                >
                  <h3 class="mb-2 text-lg font-semibold text-gray-800">
                    Diameter {{ d }}
                  </h3>
                  <div class="space-y-2">
                    <div
                      v-for="(trail, i) in trailInputs[d] || []" :key="`trail-${d}-${i}`"
                      class="flex items-center gap-2"
                    >
                      <input
                        v-model="trail.name" placeholder="Word name" class="p-1 border border-gray-400 rounded"
                        @focus="currentDiameter = d"
                      />
                      <input v-model="trail.color" type="color" />
                    </div>
                  </div>
                  <button class="flex items-center gap-1 mt-2 text-sm text-blue-600" @click="addTrailInput(d)">
                    <span>+</span> Add Trail
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
