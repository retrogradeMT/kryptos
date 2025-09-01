<script setup>
import { computed } from 'vue'

// Props accepted by this component.  A two‑dimensional array of
// objects is required for the grid.  Each cell should at least
// contain a `char` property for the character to display and may
// optionally carry a `color` property used for background
// highlighting.  The `cellSize` controls the width and height of
// each square cell in pixels and `fontSize` can override the
// computed font size.
const props = defineProps({
  grid: {
    type: Array,
    required: true,
  },
  cellSize: {
    type: Number,
    default: 32,
  },
  fontSize: {
    type: Number,
    default: 0,
  },
})

// Compute a style object for each cell.  We compute the font size
// here so that changing the `cellSize` automatically scales the
// characters.  A provided `fontSize` prop will override the
// calculation.
const cellStyle = computed(() => {
  const size = props.cellSize
  const fontSz = props.fontSize > 0 ? props.fontSize : size * 0.8
  return {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Kryptos Sculpture', monospace",
    fontSize: `${fontSz}px`,
    lineHeight: 1,
  }
})
</script>

<template>
  <!-- Render the grid row by row.  Each row is a flex container to
       align its children horizontally.  Background colours are
       pulled from the cell objects when present. -->
  <div>
    <div
      v-for="(row, rowIndex) in props.grid"
      :key="rowIndex"
      style="display: flex;"
    >
      <span
        v-for="(cell, colIndex) in row"
        :key="colIndex"
        :style="{ ...cellStyle, backgroundColor: cell.color || '#ffffff', color: 'black' }"
      >{{ cell.char }}</span>
    </div>
  </div>
</template>