<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'

// Accept the input text from the parent page.  The wrapper maintains its own
// state for rails, cell size and grid modifications.  Unlike the grid tool,
// the number of columns is fixed by the length of the input text; rails
// determines the number of rows in the zigzag pattern.
const props = withDefaults(defineProps<{ inputText: string }>(), { inputText: '' })

// Emit the flattened grid to allow chaining or exporting the transformed text
const emit = defineEmits<{ (e: 'update:output', v: string): void }>()

// Cipher mode (encrypt/decrypt).  In encrypt mode the text is written
// along a zigzag pattern and then read row by row.  In decrypt mode
// the input text is assumed to be a rail‑fence ciphertext and is
// mapped back to plaintext by filling the zigzag pattern row by row
// and then reading along the original zigzag path.
const cipherMode = ref<'encrypt' | 'decrypt'>('encrypt')

// Number of rails (rows) in the rail‑fence cipher and size of each cell.  Users
// can adjust these to see different zigzag depths and display sizes.
const rails = ref(3)
const cellSize = ref(32)

// Text for display: preserve all characters including spaces.  Some
// rail‑fence variations ignore spaces, but here we keep them so the grid
// length and user operations match the original text.  If you wish to
// discard spaces, remove the replace() call.
const cleanedInput = computed(() => props.inputText || '')

// Build the base rail grid.  This 2‑D array has `rails` rows and as many
// columns as there are characters in `cleanedInput`.  Characters are placed
// along a zigzag path: the row index increases from 0 to rails‑1 and then
// back down.  Positions not hit by the zigzag remain as a space.  The grid
// is mutated in place by the row/column operations below.
const grid = ref<string[][]>([])

/**
 * Build a rail grid for encryption.  Characters are placed along a
 * zigzag path: the row index increases from 0 to r‑1 and then
 * back down.  Positions not hit by the zigzag remain as a space.
 */

function buildRailGrid(text: string, rCount: number) {
  const r = Math.max(1, rCount)
  const cols = text.length
  const g: string[][] = Array.from({ length: r }, () => Array.from({ length: cols }).fill(' '))
  let row = 0
  let dir = r > 1 ? 1 : 0
  for (let i = 0; i < cols; i++) {
    g[row][i] = text[i]
    if (r > 1) {
      row += dir
      if (row === 0 || row === r - 1)
        dir *= -1
    }
  }
  return g
}

/**
 * Build a rail grid for decryption.  Given a ciphertext and a
 * number of rails, this reconstructs the zigzag pattern used to
 * encrypt the message.  It first determines the zigzag row index
 * for each column position, then fills those positions row by row
 * with the ciphertext.  The result is a 2‑D grid with the
 * characters placed on the correct zigzag tracks.
 */
function buildDecryptGrid(text: string, rCount: number) {
  const r = Math.max(1, rCount)
  const L = text.length
  // Compute the row index for each column position in the zigzag
  const pattern: number[] = []
  let row = 0
  let dir = r > 1 ? 1 : 0
  for (let i = 0; i < L; i++) {
    pattern.push(row)
    if (r > 1) {
      row += dir
      if (row === 0 || row === r - 1)
        dir *= -1
    }
  }
  // Prepare an empty grid
  const g: string[][] = Array.from({ length: r }, () => Array.from({ length: L }).fill(' '))
  // Fill the grid row by row using the ciphertext
  let idx = 0
  for (let rr = 0; rr < r; rr++) {
    for (let i = 0; i < L; i++) {
      if (pattern[i] === rr) {
        g[rr][i] = text[idx] || ' '
        idx++
      }
    }
  }
  return g
}

// When the input text or rails change, rebuild the base grid.  Keep
// selected row/col indices within bounds after rebuild.
const selectedRow = ref(0)
const selectedCol = ref(0)
watchEffect(() => {
  // Build the grid depending on the current cipher mode
  if (cipherMode.value === 'encrypt')
    grid.value = buildRailGrid(cleanedInput.value, rails.value)
  else
    grid.value = buildDecryptGrid(cleanedInput.value, rails.value)
  // clamp selections
  if (selectedRow.value >= rails.value)
    selectedRow.value = rails.value - 1
  const cols = cleanedInput.value.length
  if (selectedCol.value >= cols)
    selectedCol.value = cols - 1
})

// Helpers to parse offset strings into arrays.  Users can specify comma
// separated offsets for each column or row.  Offsets beyond the grid
// length are ignored.
function parseOffsets(str: string, count: number): number[] {
  const parts = str.split(',').map(p => p.trim()).filter(Boolean)
  const numbers = parts.map(p => Number(p) || 0)
  const result = new Array(count).fill(0)
  for (let i = 0; i < Math.min(numbers.length, count); i++) result[i] = numbers[i]
  return result
}

const colOffsetsInput = ref('')
const rowOffsetsInput = ref('')
const colOffsets = computed(() => parseOffsets(colOffsetsInput.value, cleanedInput.value.length))
const rowOffsets = computed(() => parseOffsets(rowOffsetsInput.value, rails.value))

// Apply offsets to a clone of the current grid.  Column offsets shift
// characters up or down within a column.  Row offsets shift characters
// left or right within a row.  Offsets wrap around the grid size.
const shiftedGrid = computed(() => {
  const base = grid.value
  const g = base.map(r => r.slice())
  // apply column offsets
  if (colOffsets.value.length) {
    const rowsCount = g.length
    const colsCount = cleanedInput.value.length
    for (let col = 0; col < colsCount; col++) {
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
      const len = row.length
      const shiftedRow: string[] = new Array(len)
      for (let c = 0; c < len; c++) shiftedRow[(c + offset + len) % len] = row[c]
      g[r] = shiftedRow
    }
  }
  return g
})

// Flatten the shifted grid row by row into a single string.  This can be
// useful for exporting the current layout or chaining into other tools.
const gridAsString = computed(() => shiftedGrid.value.flat().join(''))

// Emit the flattened grid upward whenever it changes
watchEffect(() => emit('update:output', gridAsString.value))

// Encode the original cleaned input into a rail‑fence cipher string.  This
// function writes the text on a zigzag pattern and then reads each rail
// sequentially.  It does not incorporate row/column offsets or shifts.
function encodeRailFence(text: string, r: number) {
  if (r <= 1)
    return text
  const railsArr: string[] = Array.from({ length: r }, () => '')
  let row = 0
  let dir = 1
  for (const ch of text) {
    railsArr[row] += ch
    row += dir
    if (row === 0 || row === r - 1)
      dir *= -1
  }
  return railsArr.join('')
}
const encoded = computed(() => encodeRailFence(cleanedInput.value, rails.value))

// Decode a rail‑fence ciphertext.  This function reconstructs the
// zigzag pattern and returns the plaintext by traversing the
// pattern in order.
function decodeRailFence(text: string, r: number) {
  if (r <= 1)
    return text
  const L = text.length
  // Determine row index for each position
  const pattern: number[] = []
  let row = 0
  let dir = r > 1 ? 1 : 0
  for (let i = 0; i < L; i++) {
    pattern.push(row)
    if (r > 1) {
      row += dir
      if (row === 0 || row === r - 1)
        dir *= -1
    }
  }
  // Prepare result array
  const res: string[] = new Array(L)
  let idx = 0
  for (let rr = 0; rr < r; rr++) {
    for (let i = 0; i < L; i++) {
      if (pattern[i] === rr) {
        res[i] = text[idx] || ' '
        idx++
      }
    }
  }
  return res.join('')
}

// Provide a computed that returns the transformed text based on the
// current cipher mode.  For encrypt mode we write the message on a
// zigzag and then read each rail; for decrypt mode we recover
// plaintext by filling the zigzag pattern.
const transformed = computed(() => {
  return cipherMode.value === 'encrypt'
    ? encodeRailFence(cleanedInput.value, rails.value)
    : decodeRailFence(cleanedInput.value, rails.value)
})

// Row and column manipulation functions.  These mutate the base grid in
// place.  Shifting a row moves characters left (offset -1) or right (+1).
// Shifting a column moves characters up (-1) or down (+1).  Reversing
// flips the contents of a row or column.
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
</script>

<template>
  <div>
    <!-- Controls for rails, mode, cell size and offsets -->
    <div class="flex flex-wrap items-center gap-4 mb-4">
      <label class="flex items-center gap-2">Rails
        <input v-model.number="rails" type="number" min="1" class="w-20 ml-2 text-black border" />
      </label>
      <label class="flex items-center gap-2">Mode
        <select v-model="cipherMode" class="ml-2 text-black border">
          <option value="encrypt">Encrypt</option>
          <option value="decrypt">Decrypt</option>
        </select>
      </label>
      <label class="flex items-center gap-2">Cell px
        <input v-model.number="cellSize" type="number" min="16" class="w-20 ml-2 text-black border" />
      </label>
    </div>

    <!-- Offset inputs -->
    <div class="flex gap-2 mb-4">
      <label class="flex flex-col">
        <span class="mb-1">Column offsets (comma‑sep)</span>
        <input v-model="colOffsetsInput" placeholder="e.g. 0,1,-1,0" class="w-full p-1 text-black border" />
      </label>
      <label class="flex flex-col">
        <span class="mb-1">Row offsets (comma‑sep)</span>
        <input v-model="rowOffsetsInput" placeholder="e.g. 0,-1,2" class="w-full p-1 text-black border" />
      </label>
    </div>

    <!-- Output for the current mode (encode or decode) -->
    <div class="mb-4">
      <p class="font-semibold">
        {{ cipherMode === 'encrypt' ? 'Encoded' : 'Decoded' }} (rail fence):
      </p>
      <textarea :value="transformed" rows="3" class="w-full p-2 mt-1 font-mono text-black border" readonly></textarea>
    </div>

    <!-- Row manipulation tools -->
    <div class="flex flex-wrap items-center gap-2 mb-2">
      <span class="font-semibold">Row tools:</span>
      <input v-model.number="selectedRow" type="number" :max="rails - 1" min="0" class="w-20 text-black border" />
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

    <!-- Column manipulation tools -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <span class="font-semibold">Column tools:</span>
      <input
        v-model.number="selectedCol" type="number" :max="cleanedInput.length - 1" min="0"
        class="w-20 text-black border"
      />
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

    <!-- Rail fence display.  Pass the shifted grid into the renderer.  We
         still supply the original cleanedInput as `text` because the
         component requires it, but it will be ignored when a grid is
         provided. -->
    <div>
      <redefence :text="cleanedInput" :rails="rails" :grid="shiftedGrid" :cell-size="cellSize" />
    </div>
  </div>
</template>

<style scoped></style>
