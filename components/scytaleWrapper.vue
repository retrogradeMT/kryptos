<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import scytale from '~/components/scytale.vue'

// This wrapper component accepts a plaintext string via its
// `inputText` prop and uses it to construct a scytale cipher
// grid.  Local controls allow the user to adjust the diameter
// (number of columns), rotation offset, and whether to reverse
// rows or columns.  The computed grid is rendered via the
// `<scytale>` display component and the resulting ciphertext is
// emitted upward on each change.
const props = defineProps({
  inputText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{ (e: 'update:output', v: string): void }>()

// User‑adjustable settings.  Diameter controls the number of
// columns in the scytale; offset rotates the input before
// filling the grid.  Rows or columns can be reversed to read
// the grid from different perspectives.  `cellSize` and
// `fontSize` adjust the visual size of the rendered grid.
const diameter = ref(16)
const offset = ref(0)
const reverseRows = ref(false)
const reverseColumns = ref(false)
const cellSize = ref(32)
const fontSize = ref(0)

// Highlighting support.  A letter highlight map can be used to
// assign background colours to specific letters.  Users can
// provide highlight rules however they like via the UI – we
// initialise to an empty object here.
const highlightColor = ref('#ffff00')
const letterHighlights = ref<Record<string, string>>({})

// Compute a cleaned version of the input text.  We remove
// whitespace and convert to upper case.  Non‑alphanumeric
// characters are preserved so that the original message length
// doesn’t change (dashes or punctuation will be treated as
// fillers in the grid).
const flatText = computed(() => {
  return props.inputText.replace(/\s+/g, '').toUpperCase()
})

// Build the scytale grid.  The message is rotated by `offset`
// before being padded to fill a complete grid of size
// `rows × diameter`.  The fill order traverses columns first,
// wrapping around after the last row.  Cells carry their
// character, a highlight colour if defined for that character,
// and row/column indices for future manipulation.
function buildGrid(): { char: string; color: string; row: number; col: number }[][] {
  const text = flatText.value
  const d = Math.max(1, diameter.value)
  if (!text) return []
  // Limit offset to the length of the text to avoid unnecessary
  // rotations.  Negative offsets are normalised to positive.
  const len = text.length
  let rot = offset.value % len
  if (rot < 0) rot += len
  const rows = Math.ceil(len / d)
  const rotated = text.slice(rot) + text.slice(0, rot)
  const padded = rotated.padEnd(rows * d, '.')
  const grid: { char: string; color: string; row: number; col: number }[][] = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < d; c++) {
      const idx = r + c * rows
      const ch = padded[idx] || '.'
      const colour = letterHighlights.value[ch.toUpperCase()] || '#ffffff'
      row.push({ char: ch, color: colour, row: r, col: c })
    }
    grid.push(row)
  }
  let finalGrid = [...grid]
  if (reverseRows.value) finalGrid = finalGrid.map(rw => rw.slice().reverse())
  if (reverseColumns.value) finalGrid = finalGrid.slice().reverse()
  return finalGrid
}

// Reactive grid.  Recompute whenever the inputs or settings
// change.
const grid = ref(buildGrid())
watchEffect(() => {
  grid.value = buildGrid()
})

// Flatten the grid into a ciphertext string by reading across
// rows.  Dots used for padding are removed and the result is
// lowercased for presentation.
const outputString = computed(() => {
  return grid.value
    .flat()
    .map(cell => cell.char)
    .join('')
    .replace(/\./g, '')
    .toLowerCase()
})

// Emit the updated output string whenever it changes.  Parent
// components can listen to this event to retrieve the current
// cipher result.  This is optional for pages that just display
// the cipher but ensures consistency with other wrappers in this
// project.
watchEffect(() => {
  emit('update:output', outputString.value)
})
</script>

<template>
  <div>
    <!-- Control panel: diameter, offset, reversals and cell sizing -->
    <div class="flex flex-wrap items-center gap-4 mb-4">
      <label class="flex items-center gap-2">Columns
        <input
          v-model.number="diameter"
          type="number"
          min="1"
          class="w-20 text-black"
        />
      </label>
      <label class="flex items-center gap-2">Offset
        <input
          v-model.number="offset"
          type="number"
          min="0"
          class="w-20 text-black"
        />
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="reverseRows" />
        Reverse Rows
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="reverseColumns" />
        Reverse Columns
      </label>
      <label class="flex items-center gap-2">Cell Size
        <input
          v-model.number="cellSize"
          type="number"
          min="10"
          class="w-20 text-black"
        />
      </label>
      <label class="flex items-center gap-2">Font Size
        <input
          v-model.number="fontSize"
          type="number"
          min="0"
          class="w-20 text-black"
        />
      </label>
    </div>
    <!-- Render the scytale grid.  Passing the computed grid and
         sizing props down to the display component. -->
    <scytale :grid="grid" :cell-size="cellSize" :font-size="fontSize" />
  </div>
</template>