<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'

const props = withDefaults(defineProps<{ inputText: string }>(), { inputText: '' })

const emit = defineEmits<{ (e: 'update:output', v: string): void }>()

const selectedRow = ref(0)
const selectedCol = ref(0)
const gridCols = ref(16)
const angleIndex = ref(0) // -14..14
const cellSize = ref(32)

// Convert the slider position (-14 to +14) into degrees.  Using 180/14 yields
// a range of -180°..+180° for intuitive rotation.  Adjust the divisor if a
// different range is desired.
const angleDeg = computed(() => angleIndex.value * (180 / 14))
const cleanedInput = computed(() => props.inputText || '')

// Number of rows in the current work grid
const numRows = computed(() => grid.value.length)

function parseOffsets(str: string, count: number): number[] {
  const parts = str.split(',').map(p => p.trim()).filter(Boolean)
  const numbers = parts.map(p => Number(p) || 0)
  const result = new Array(count).fill(0)
  for (let i = 0; i < Math.min(numbers.length, count); i++) result[i] = numbers[i]
  return result
}

const colOffsetsInput = ref('')
const rowOffsetsInput = ref('')
const colOffsets = computed(() => parseOffsets(colOffsetsInput.value, gridCols.value))
const rowOffsets = computed(() => parseOffsets(rowOffsetsInput.value, numRows.value))

// Build base grid
// Work grid used for offsets and shifts.  It is updated whenever the input
// text or column count changes, and mutated in-place by the row/column
// operations.
const grid = ref<string[][]>([])

// Build or rebuild the base grid from the input text whenever the cleaned
// input or column count changes.  The text is split into rows of equal
// length and padded with spaces to fill the last row.
watchEffect(() => {
  const chars = cleanedInput.value.split('')
  const rows: string[][] = []
  for (let i = 0; i < chars.length; i += gridCols.value) {
    let row = chars.slice(i, i + gridCols.value)
    if (row.length < gridCols.value)
      row = row.concat(Array.from({ length: gridCols.value - row.length }).fill(' '))
    rows.push(row)
  }
  grid.value = rows
  // Keep selected row/col indices within bounds
  if (selectedRow.value >= rows.length)
    selectedRow.value = rows.length - 1
  if (selectedCol.value >= gridCols.value)
    selectedCol.value = gridCols.value - 1
})

// Apply offsets
const shiftedGrid = computed(() => {
  // Clone the current grid before applying offsets
  const g = grid.value.map(r => r.slice())
  // apply column offsets
  if (colOffsets.value.length) {
    const rowsCount = g.length
    for (let col = 0; col < gridCols.value; col++) {
      const offset = colOffsets.value[col] || 0
      if (!offset)
        continue
      const colVals = g.map(row => row[col])
      const shifted = new Array(rowsCount)
      for (let r = 0; r < rowsCount; r++) shifted[(r + offset + rowsCount) % rowsCount] = colVals[r]
      for (let r = 0; r < rowsCount; r++) g[r][col] = shifted[r]
    }
  }
  // apply row offsets
  if (rowOffsets.value.length) {
    for (let r = 0; r < g.length; r++) {
      const offset = rowOffsets.value[r] || 0
      if (!offset)
        continue
      const row = g[r]
      const shiftedRow: string[] = Array.from({ length: row.length })
      for (let c = 0; c < row.length; c++) shiftedRow[(c + offset + row.length) % row.length] = row[c]
      g[r] = shiftedRow
    }
  }
  return g
})

const wrapperStyle = computed(() => {
  const rowsCount = grid.value.length
  const w = gridCols.value * cellSize.value
  const h = rowsCount * cellSize.value
  const theta = angleDeg.value * Math.PI / 180
  const bboxW = Math.abs(w * Math.cos(theta)) + Math.abs(h * Math.sin(theta))
  const bboxH = Math.abs(w * Math.sin(theta)) + Math.abs(h * Math.cos(theta))
  return { width: `${bboxW}px`, height: `${bboxH}px`, position: 'relative', overflow: 'visible' as const }
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${gridCols.value}, ${cellSize.value}px)`,
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: `translate(-50%, -50%) rotate(${angleDeg.value}deg)`,
  transformOrigin: 'center',
}))

const cellStyle = computed(() => ({
  width: `${cellSize.value}px`,
  height: `${cellSize.value}px`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: '\'Kryptos Sculpture\', monospace',
  fontSize: `${cellSize.value * 0.8}px`,
  lineHeight: 1,
  transform: `rotate(${-angleDeg.value}deg)`,
}))

// Mutators
function shiftRow(rowIndex: number, offset: number) {
  const row = grid.value[rowIndex]
  if (!row)
    return
  const len = row.length
  const newRow: string[] = new Array(len)
  for (let c = 0; c < len; c++) newRow[(c + offset + len) % len] = row[c]
  grid.value[rowIndex] = newRow
}

function shiftColumn(colIndex: number, offset: number) {
  const g = grid.value
  const len = g.length
  const column = g.map(r => r[colIndex])
  const shifted: string[] = new Array(len)
  for (let r = 0; r < len; r++) shifted[(r + offset + len) % len] = column[r]
  for (let r = 0; r < len; r++) g[r][colIndex] = shifted[r]
}

function reverseRow(rowIndex: number) {
  const row = grid.value[rowIndex]
  if (row)
    grid.value[rowIndex] = [...row].reverse()
}

function reverseColumn(colIndex: number) {
  const g = grid.value
  const len = g.length
  for (let i = 0; i < Math.floor(len / 2); i++) {
    const j = len - 1 - i
    const tmp = g[i][colIndex]
    g[i][colIndex] = g[j][colIndex]
    g[j][colIndex] = tmp
  }
}

// Emit output for chaining
const gridAsString = computed(() => shiftedGrid.value.flat().join(''))
watchEffect(() => emit('update:output', gridAsString.value))
</script>

<template>
  <div>
    <div class="flex gap-2 mb-8">
      <label class="flex flex-col">
        <span class="mb-1">Column offsets (comma‑sep)</span>
        <input v-model="colOffsetsInput" placeholder="e.g. 0,1,-1,0" class="w-full p-1 text-black border" />
      </label>
      <label class="flex flex-col">
        <span class="mb-1">Row offsets (comma‑sep)</span>
        <input v-model="rowOffsetsInput" placeholder="e.g. 0,-1,2" class="w-full p-1 text-black border" />
      </label>
    </div>

    <div class="flex flex-wrap items-center gap-4 mb-6">
      <label class="flex items-center gap-2">Columns
        <input v-model.number="gridCols" type="number" min="2" class="w-20 ml-2 text-black border" />
      </label>
      <label class="flex items-center gap-2">Angle ({{ angleDeg.toFixed(1) }}°)
        <input v-model.number="angleIndex" type="range" min="-14" max="14" step="1" class="w-96" />
      </label>
      <label class="flex items-center gap-2">Cell px
        <input v-model.number="cellSize" type="number" min="16" class="w-20 ml-2 text-black border" />
      </label>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-2">
      <span class="font-semibold">Row tools:</span>
      <input v-model.number="selectedRow" type="number" :max="numRows - 1" min="0" class="w-20 text-black border" />
      <button title="Shift row left" @click="shiftRow(selectedRow, -1)">
        ⇤
      </button>
      <button title="Shift row right" @click="shiftRow(selectedRow, 1)">
        ⇥
      </button>
      <button title="Reverse row" @click="reverseRow(selectedRow)">
        ⟲
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-6">
      <span class="font-semibold">Column tools:</span>
      <input v-model.number="selectedCol" type="number" :max="gridCols - 1" min="0" class="w-20 text-black border" />
      <button title="Shift col up" @click="shiftColumn(selectedCol, -1)">
        ⇞
      </button>
      <button title="Shift col down" @click="shiftColumn(selectedCol, 1)">
        ⇟
      </button>
      <button title="Reverse col" @click="reverseColumn(selectedCol)">
        ⟲
      </button>
    </div>

    <!-- Grid renderer -->
    <div>
      <!-- Pass the fully transformed grid as a flat string along with the
           current column count, rotation angle (in degrees) and cell size -->
      <rotating-grid :text="gridAsString" :cols="gridCols" :angle="angleDeg" :cell-size="cellSize" />
    </div>
  </div>
</template>
