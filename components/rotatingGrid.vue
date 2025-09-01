<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  cols: { type: Number, default: 14 },
  angle: { type: Number, default: 0 },
  // New prop: controls the width/height of each cell in pixels
  cellSize: { type: Number, default: 32 },
  // Optional prop: override font size; falls back to 0.8 × cellSize
  fontSize: { type: Number, default: 0 },
})

// Break text into rows of equal length
const grid = computed(() => {
  const chars = props.text.split('')
  const rows = []
  for (let i = 0; i < chars.length; i += props.cols) {
    let row = chars.slice(i, i + props.cols)
    if (row.length < props.cols) {
      row = row.concat(Array.from({ length: props.cols - row.length }).fill(' '))
    }
    rows.push(row)
  }
  return rows
})

// Compute the bounding box dimensions
const wrapperStyle = computed(() => {
  const rowsCount = grid.value.length
  const w = props.cols * props.cellSize
  const h = rowsCount * props.cellSize
  const theta = props.angle * Math.PI / 180
  const bboxW = Math.abs(w * Math.cos(theta)) + Math.abs(h * Math.sin(theta))
  const bboxH = Math.abs(w * Math.sin(theta)) + Math.abs(h * Math.cos(theta))
  return {
    width: `${bboxW}px`,
    height: `${bboxH}px`,
    position: 'relative',
    overflow: 'visible',
  }
})

// Centre and rotate the grid
const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.cols}, ${props.cellSize}px)`,
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: `translate(-50%, -50%) rotate(${props.angle}deg)`,
  transformOrigin: 'center',
}))

// Style each cell: size, font, counter‑rotation, and font size
const cellStyle = computed(() => {
  // Use provided fontSize or fallback to 80% of the cell size
  const fontSz = props.fontSize > 0 ? props.fontSize : props.cellSize * 0.8
  return {
    width: `${props.cellSize}px`,
    height: `${props.cellSize}px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // Apply your custom font (ensure it’s loaded via @font-face or included globally)
    fontFamily: '\'Kryptos Sculpture\', monospace',
    fontSize: `${fontSz}px`,
    lineHeight: 1,
    transform: `rotate(${-props.angle}deg)`,
  }
})
</script>

<template>
  <div :style="wrapperStyle">
    <div :style="gridStyle">
      <template v-for="(row, r) in grid" :key="r">
        <template v-for="(char, c) in row" :key="c">
          <span :style="cellStyle">{{ char }}</span>
        </template>
      </template>
    </div>
  </div>
</template>
