<script setup>
import { computed, ref } from 'vue'

const rawInput = ref('')
const reverseInput = ref(false)
const railHeight = ref(4)
const offset = ref(0)
const stackReversedRail = ref(false)
const reverseLines = ref(new Set())
const mode = ref('decrypt')
const reverseRailOffset = ref(0)
const visualShift = ref(0)
const verticalStackOffset = ref(3)
const reverseVisualShift = ref(0)
const printMode = ref(false)

function toggleReverseLine(idx) {
  if (reverseLines.value.has(idx))
    reverseLines.value.delete(idx)
  else
    reverseLines.value.add(idx)
}

const processedText = computed(() => {
  let text = rawInput.value.replace(/\s+/g, '').toUpperCase()
  if (reverseInput.value)
    text = [...text].reverse().join('')
  return text
})

function railNumber(pos, key, offset) {
  pos = (pos + offset) % (key * 2 - 2)
  return pos < key ? pos : 2 * key - pos - 2
}

function buildRail(text, height) {
  if (height < 2)
    return []

  const length = text.length
  const rows = Array.from({ length: height }, () => new Array(length).fill(' '))

  if (mode.value === 'encrypt') {
    for (let i = 0; i < text.length; i++) {
      const row = railNumber(i, height, offset.value)
      rows[row][i] = text[i]
    }
  }
  else {
    // decrypt mode: simulate reverse mapping
    const order = []
    for (let i = 0; i < text.length; i++) {
      const row = railNumber(i, height, offset.value)
      order.push({ row, index: i })
    }

    let pointer = 0
    const sortedByRail = Array.from({ length: height }, () => [])
    for (let r = 0; r < height; r++) {
      for (let i = 0; i < order.length; i++) {
        if (order[i].row === r) {
          sortedByRail[r].push(i)
        }
      }
    }

    const result = Array.from({ length: text.length })
    for (let r = 0; r < height; r++) {
      const rowSlots = sortedByRail[r]
      for (let i = 0; i < rowSlots.length; i++) {
        const pos = rowSlots[i]
        result[pos] = text[pointer++]
        rows[r][pos] = text[pointer - 1]
      }
    }
  }

  return rows.map((r, i) =>
    reverseLines.value.has(i) ? [...r].reverse() : r,
  )
}

function buildRailWithOffset(text, height, customOffset) {
  if (height < 2)
    return []

  const rows = Array.from({ length: height }, () => Array.from({ length: text.length }).fill(' '))

  if (mode.value === 'encrypt') {
    for (let i = 0; i < text.length; i++) {
      const row = railNumber(i, height, customOffset)
      rows[row][i] = text[i]
    }
  }
  else {
    const order = []
    for (let i = 0; i < text.length; i++) {
      const row = railNumber(i, height, customOffset)
      order.push({ row, index: i })
    }

    let pointer = 0
    const sortedByRail = Array.from({ length: height }, () => [])
    for (let r = 0; r < height; r++) {
      for (let i = 0; i < order.length; i++) {
        if (order[i].row === r) {
          sortedByRail[r].push(i)
        }
      }
    }

    for (let r = 0; r < height; r++) {
      const rowSlots = sortedByRail[r]
      for (let i = 0; i < rowSlots.length; i++) {
        const pos = rowSlots[i]
        rows[r][pos] = text[pointer++]
      }
    }
  }

  return rows.map((r, i) =>
    reverseLines.value.has(i) ? [...r].reverse() : r,
  )
}

const combinedGrid = computed(() => {
  const top = buildRailWithOffset(processedText.value, railHeight.value, offset.value)
  const bottom = stackReversedRail.value
    ? buildRailWithOffset([...processedText.value].reverse().join(''), railHeight.value, reverseRailOffset.value)
    : []

  const verticalShift = stackReversedRail.value ? verticalStackOffset.value : 0
  const rowCount = Math.max(top.length, (bottom.length || 0) + Math.abs(verticalShift))
  const colCount = Math.max(
    ...top.map(r => r.length),
    ...(bottom.map(r => r.length) || []),
  )

  const grid = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({ top: '', bottom: '' })))

  // Fill top with visual shift
  for (let r = 0; r < top.length; r++) {
    for (let c = 0; c < top[r].length; c++) {
      if (top[r][c] !== ' ') {
        const col = c + visualShift.value
        if (col >= 0 && col < colCount)
          grid[r][col].top = top[r][c]
      }
    }
  }

  // Fill bottom, with vertical and visual shift applied
  for (let r = 0; r < bottom.length; r++) {
    const targetRow = r + verticalStackOffset.value
    if (targetRow < 0 || targetRow >= grid.length)
      continue
    for (let c = 0; c < bottom[r].length; c++) {
      if (bottom[r][c] !== ' ') {
        const col = c + reverseVisualShift.value
        if (col >= 0 && col < colCount)
          grid[targetRow][col].bottom = bottom[r][c]
      }
    }
  }

  return grid
})
</script>

<template>
  <div class="min-h-screen p-6 space-y-6 text-white bg-gray-900 scanlines">
    <h1 class="text-2xl font-bold text-lime-300">
      Rail Cipher Playground
    </h1>

    <div class="space-y-4">
      <div>
        <label class="block mb-1 text-sm">Paste Ciphertext</label>
        <textarea v-model="rawInput" rows="4" class="w-full p-2 font-mono border-white border-1"></textarea>
      </div>

      <div class="flex flex-wrap items-center gap-4 text-white">
        <label><input v-model="printMode" type="checkbox" /> Print-Friendly Mode</label>
        <label><input v-model="reverseInput" type="checkbox" /> Reverse Text</label>
        <label>Rails: <input v-model.number="railHeight" type="number" class="w-16 ml-2" min="2" /></label>
        <label><input v-model="stackReversedRail" type="checkbox" /> Stack Reversed Rail</label>
        <label>Offset: <input v-model.number="offset" type="number" class="w-16 ml-2" /></label>
        <label v-if="stackReversedRail">Reverse Rail Offset: <input
          v-model.number="reverseRailOffset" type="number"
          class="w-16 ml-2 text-black"
        /></label>
        <label>Visual Shift: <input v-model.number="visualShift" type="number" class="w-16 ml-2 " /></label>
        <label v-if="stackReversedRail">Reverse Visual Shift: <input
          v-model.number="reverseVisualShift" type="number"
          class="w-16 ml-2 text-black"
        /></label>
        <label v-if="stackReversedRail">Vertical Stack Offset: <input
          v-model.number="verticalStackOffset" type="number"
          class="w-16 ml-2 text-black"
        /></label>
      </div>
      <div class="flex items-center gap-4">
        <label><input v-model="mode" type="radio" value="encrypt" /> Encrypt</label>
        <label><input v-model="mode" type="radio" value="decrypt" /> Decrypt</label>
      </div>
    </div>

    <div class="mt-4 space-y-2" :class="[printMode ? 'bg-white text-black p-4 rounded' : '']">
      <h2 class="text-lg font-bold">
        Rail Output
      </h2>

      <div v-for="(row, rIdx) in combinedGrid" :key="`row-${rIdx}`" class="rail-row">
        <span v-for="(cell, cIdx) in row" :key="`cell-${cIdx}`" class="rail-cell">
          <span v-if="cell.top && !cell.bottom" :class="printMode ? 'text-black' : 'text-lime-300'">
            {{ cell.top }}
          </span>
          <span
            v-else-if="cell.bottom && !cell.top" class="offset-bottom"
            :class="[printMode ? 'text-black' : 'text-pink-400']"
          >
            {{ cell.bottom }}
          </span>
          <span v-else-if="cell.top && cell.bottom">
            <span :class="printMode ? 'text-black' : 'text-lime-300'">{{ cell.top }}</span>
            <br />
            <span class="offset-bottom" :class="[printMode ? 'text-black' : 'text-pink-400']">{{ cell.bottom }}</span>
          </span>
          <span v-else>&nbsp;</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(1ch, 1fr));
  white-space: pre;
  font-family: monospace;
}
.rail-row {
  display: flex;
  line-height: 1.2;
  margin-bottom: -0.3em;
}
.rail-cell {
  width: 1ch;
  text-align: center;
  position: relative;
}
.offset-bottom {
  display: inline-block;
  transform: translateX(0.4ch) translateY(-0.2em);
  line-height: 1;
}
</style>
