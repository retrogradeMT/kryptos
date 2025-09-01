<script setup>
import { computed } from 'vue'

// This component draws a Rail Fence (redefence) cipher layout.  The text is
// arranged on a zigzag of N rails (rows) and displayed row by row.  You can
// control the number of rails and the cell size.
// This component renders a rail‑fence cipher in a grid.  Normally it
// constructs the zigzag pattern from the provided `text` and `rails`
// props.  However, it can also accept a preconstructed 2‑D array via
// the optional `grid` prop, in which case that grid is rendered
// directly.  This allows wrapper components to perform row/column
// manipulations on the rail layout before it is drawn.
const props = defineProps({
  /**
   * The flat text to render in rail‑fence order.  Ignored when a
   * `grid` is supplied.  Each character of this string will occupy
   * one column in the output when computing the zigzag internally.
   */
  text: { type: String, required: true },
  /**
   * Number of rails (rows) to use when computing the rail pattern.
   * This has no effect if a custom `grid` is provided.
   */
  rails: { type: Number, default: 3 },
  /**
   * Optional prebuilt grid.  If provided, the component will render
   * this grid as‑is instead of computing the zigzag from `text`.
   */
  grid: { type: Array, default: undefined },
  /**
   * Size of each cell in pixels.  Both width and height use this
   * value.  Font size is set to roughly 80% of this size.
   */
  cellSize: { type: Number, default: 32 },
})

// Build the rail grid.  Each row represents a rail, and columns
// correspond to successive characters in the input.  A character is
// placed on the current rail and the rail index moves down and up
// between 0 and rails − 1.  If a custom `grid` prop is provided, it
// will be used instead of this computed value.
const railGrid = computed(() => {
  // If the caller supplied a custom grid (typically a 2‑D array of
  // strings), simply return that.  Use a shallow copy to avoid
  // accidental mutations here bubbling back up to the parent.
  if (Array.isArray(props.grid) && props.grid.length > 0) {
    return props.grid.map(row => Array.isArray(row) ? row.slice() : [])
  }
  const rCount = Math.max(1, props.rails)
  const cols = props.text.length
  const grid = Array.from({ length: rCount }, () => Array.from({ length: cols }).fill(' '))
  let row = 0
  let dir = rCount > 1 ? 1 : 0 // direction: 1 downwards, -1 upwards
  for (let i = 0; i < props.text.length; i++) {
    grid[row][i] = props.text[i]
    if (rCount > 1) {
      row += dir
      if (row === 0 || row === rCount - 1)
        dir *= -1
    }
  }
  return grid
})

// Style for each rail row
const railStyle = computed(() => ({
  fontFamily: '\'Kryptos Sculpture\', monospace',
  fontSize: `${props.cellSize * 0.8}px`,
  lineHeight: 1,
  display: 'flex',
}))

// Style for each character cell
const cellStyle = computed(() => ({
  width: `${props.cellSize}px`,
  height: `${props.cellSize}px`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}))
</script>

<template>
  <div>
    <div v-for="(row, r) in railGrid" :key="r" :style="railStyle">
      <span v-for="(ch, c) in row" :key="c" :style="cellStyle">{{ ch }}</span>
    </div>
  </div>
</template>

<style scoped></style>
