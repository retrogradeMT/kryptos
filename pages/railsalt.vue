<script setup>
import { computed, ref } from 'vue'

// --- Analog Clock Hand Controls ---
// Ensure clock hands default to midnight (00:00)
const clockHourHand = ref(0)
const clockMinuteHand = ref(0)

const rawInput = ref('')
const secondaryInput = ref('')
const reverseInput = ref(false)
const railHeight = ref(4)
const offset = ref(0)
const stackReversedRail = ref(false)
const reverseLines = ref(new Set())
const mode = ref('encrypt')
const reverseRailOffset = ref(0)
const visualShift = ref(0)
const verticalStackOffset = ref(3)
const reverseVisualShift = ref(0)

const printMode = ref(false)

// Morse word lists
const wordInputsWithE = [
  'EEVIRTUALLYE',
  'EEEEEEINVISIBLE',
  'EESHADOWEE',
  'FORCESEEEEE',
  'LUCIDEEE',
  'MEMORYE',
  'RQ',
  'SOS',
  'EDIGETALEEE',
  'INTERPRETATIO',
  'TISYOUR',
  'POSITIONE',
]

const wordInputs = [
  'VIRTUALLY',
  'INVISIBLE',
  'SHADOW',
  'FORCES',
  'LUCID',
  'MEMORY',
  'RQ',
  'SOS',
  'DIGETAL',
  'INTERPRETATIU',
  'TISYOUR',
  'POSITION',
]

const selectedList = ref([]) // [{ letter: 'A', coord: '1.2' }, ...]

function coordString(row, col) {
  return `${row + 1}.${col + 1}`
}

function recordSelection(letter, rowIdx, colIdx) {
  if (!letter || letter === ' ')
    return
  selectedList.value.push({ letter, coord: coordString(rowIdx, colIdx) })
}

const modeLabel = computed(() => (mode.value === 'encrypt' ? 'Encrypt' : 'Decrypt'))

const selectedDisplay = computed(() => {
  return `{ ${selectedList.value.map(e => `${e.letter}: ${e.coord}`).join(', ')} }`
})

function clearSelections() {
  selectedList.value = []
}
function removeLast() {
  selectedList.value.pop()
}

// --- Morse Reorderable Section ---
const reorderWords = ref([])

// New: wordClockMeta structure for clock variables per word
import { watch } from 'vue'

const wordClockMeta = ref({})

function initClockMeta(words) {
  wordClockMeta.value = {}
  for (const word of words) {
    wordClockMeta.value[word] = {
      clockA: 0,
      clockB: 0,
      clockC: 0,
      dots: 0,
      dashes: 0,
    }
  }
}

function moveWordUp(index) {
  if (index > 0) {
    const tmp = reorderWords.value[index]
    reorderWords.value[index] = reorderWords.value[index - 1]
    reorderWords.value[index - 1] = tmp
  }
}

function moveWordDown(index) {
  if (index < reorderWords.value.length - 1) {
    const tmp = reorderWords.value[index]
    reorderWords.value[index] = reorderWords.value[index + 1]
    reorderWords.value[index + 1] = tmp
  }
}

// --- Word Pair Mode additions ---
const wordPairMode = ref(false)

// Dynamically sort word order based on proximity to the clock hand time
const orderedMorseInput = computed(() => {
  // Center point on the clock, as a float (0-24)
  const center = clockHourHand.value + clockMinuteHand.value / 60

  if (wordPairMode.value) {
    // Use wordPairs and wordPairTotals, sort pairs by total proximity to center
    const pairsWithTotals = wordPairs.value.map((pair, idx) => ({
      words: pair,
      total: wordPairTotals.value[idx],
    }))
    const sorted = pairsWithTotals.slice().sort((a, b) => {
      const distA = Math.abs((a.total % 24) - center)
      const distB = Math.abs((b.total % 24) - center)
      return distA - distB
    })
    return sorted.flatMap(e => e.words).join(' ')
  }
  else {
    // Sort individual words by their total proximity to center
    const wordObjs = reorderWords.value.map(word => ({
      word,
      total: (wordClockMeta.value[word]?.dots || 0) + (wordClockMeta.value[word]?.dashes || 0),
    }))
    const sorted = wordObjs.slice().sort((a, b) => {
      const distA = Math.abs((a.total % 24) - center)
      const distB = Math.abs((b.total % 24) - center)
      return distA - distB
    })
    return sorted.map(e => e.word).join(' ')
  }
})

// This watcher ensures rail cipher input is based on sorted proximity order
watch(orderedMorseInput, (val) => {
  rawInput.value = val
  const words = val.split(' ')
  if (!wordPairMode.value) {
    reorderWords.value = words
  }
  else {
    reorderWords.value = []
    for (let i = 0; i < words.length; i += 2) {
      reorderWords.value.push(words[i])
      if (words[i + 1])
        reorderWords.value.push(words[i + 1])
    }
  }
})

function loadMorse(withEE = true) {
  const words = withEE ? [...wordInputsWithE] : [...wordInputs]
  reorderWords.value = words
  initClockMeta(words)
}

const wordPairs = computed(() => {
  const pairs = []
  for (let i = 0; i < reorderWords.value.length; i += 2) {
    const pair = [reorderWords.value[i], reorderWords.value[i + 1]].filter(Boolean)
    if (pair.length)
      pairs.push(pair)
  }
  return pairs
})

const wordPairTotals = computed(() => {
  return wordPairs.value.map(([w1, w2]) => {
    const a = wordClockMeta.value[w1] || {}
    const b = wordClockMeta.value[w2] || {}
    return (a.dots || 0) + (a.dashes || 0) + (b.dots || 0) + (b.dashes || 0)
  })
})

// --- Clock Points for SVG Analog Clock ---
const clockPoints = computed(() => {
  const points = []
  if (wordPairMode.value) {
    wordPairs.value.forEach((pair, idx) => {
      const label = pair.join('+')
      const total = wordPairTotals.value[idx]
      const hour = Math.floor(total)
      const minute = Math.round((total - hour) * 60)
      points.push({ label, hour, minute })
    })
  }
  else {
    reorderWords.value.forEach((word) => {
      const meta = wordClockMeta.value[word] || {}
      const total = (meta.dots || 0) + (meta.dashes || 0)
      const hour = Math.floor(total)
      const minute = Math.round((total - hour) * 60)
      points.push({ label: word, hour, minute })
    })
  }
  return points
})

const summaryText = computed(() => {
  return [
    `input = "${rawInput.value}"`,
    `rails: ${railHeight.value}`,
    `offset: ${offset.value}`,
    `Mode: ${modeLabel.value}`,
    `Stacked Reverse Rail : ${stackReversedRail.value ? 'True' : 'False'}`,
    `Stacked Reverse Rail offset: ${reverseRailOffset.value}`,
    `Selected letters: ${selectedDisplay.value}`,
  ].join('\n')
})

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
    ? buildRailWithOffset(secondaryInput.value.length > 0 ? secondaryInput.value : [...processedText.value].reverse().join(''), railHeight.value, reverseRailOffset.value)
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
  <div class="min-h-screen p-6 space-y-6 text-white bg-gray-900">
    <h1 class="text-2xl font-bold text-lime-300">
      Rail Cipher Playground
    </h1>

    <div class="space-y-4">
      <div>
        <label class="block mb-1 text-sm">Paste Ciphertext</label>
        <textarea v-model="rawInput" rows="4" class="w-full p-2 font-mono text-black"></textarea>
      </div>

      <div v-if="stackReversedRail">
        <label class="block mb-1 text-sm">Optional Secondary Text for Stacked Reverse Rail</label>
        <textarea v-model="secondaryInput" rows="4" class="w-full p-2 font-mono text-black"></textarea>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <label><input v-model="printMode" type="checkbox" /> Print-Friendly Mode</label>
        <label><input v-model="reverseInput" type="checkbox" /> Reverse Text</label>
        <label>Rails: <input v-model.number="railHeight" type="number" class="w-16 ml-2 text-black" min="2" /></label>
        <label><input v-model="stackReversedRail" type="checkbox" /> Stack Reversed Rail</label>
        <label>Offset: <input v-model.number="offset" type="number" class="w-16 ml-2 text-black" /></label>
        <label v-if="stackReversedRail">Reverse Rail Offset: <input v-model.number="reverseRailOffset" type="number" class="w-16 ml-2 text-black" /></label>
        <label>Visual Shift: <input v-model.number="visualShift" type="number" class="w-16 ml-2 text-black" /></label>
        <label v-if="stackReversedRail">Reverse Visual Shift: <input v-model.number="reverseVisualShift" type="number" class="w-16 ml-2 text-black)" /></label>
        <label v-if="stackReversedRail">Vertical Stack Offset: <input v-model.number="verticalStackOffset" type="number" class="w-16 ml-2 text-black" /></label>
      </div>
      <!-- New quick-load buttons for Morse code -->
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="px-3 py-1 text-sm text-black bg-gray-200 rounded" @click="loadMorse(true)">
          Load Morse (with EE)
        </button>
        <button type="button" class="px-3 py-1 text-sm text-black bg-gray-200 rounded" @click="loadMorse(false)">
          Load Morse (no EE)
        </button>
      </div>
      <!-- Morse reorderable list -->
      <div class="mt-4">
        <h3 class="font-bold text-white">
          Reorder Morse Words
        </h3>
        <div v-for="(word, index) in reorderWords" :key="index" class="flex flex-col gap-1 mb-2">
          <div class="flex items-center gap-2">
            <div class="w-32 p-1 text-black bg-white">
              {{ word }}
            </div>
            <button class="px-2 bg-blue-600 rounded" :disabled="index === 0" @click="moveWordUp(index)">
              ↑
            </button>
            <button class="px-2 bg-blue-600 rounded" :disabled="index === reorderWords.length - 1" @click="moveWordDown(index)">
              ↓
            </button>
          </div>
          <!-- Clock and Morse breakdown fields -->
          <div class="flex flex-wrap gap-2 p-1 text-xs text-black bg-white rounded">
            <label>
              A: <input v-model.number="wordClockMeta[word].clockA" type="number" class="w-10 border border-gray-300" />
            </label>
            <label>
              B: <input v-model.number="wordClockMeta[word].clockB" type="number" class="w-10 border border-gray-300" />
            </label>
            <label>
              C: <input v-model.number="wordClockMeta[word].clockC" type="number" class="w-10 border border-gray-300" />
            </label>
            <label>
              •: <input v-model.number="wordClockMeta[word].dots" type="number" class="w-10 border border-gray-300" />
            </label>
            <label>
              –: <input v-model.number="wordClockMeta[word].dashes" type="number" class="w-10 border border-gray-300" />
            </label>
            <span>Total: {{ wordClockMeta[word].dots + wordClockMeta[word].dashes }}</span>
          </div>
        </div>
        <div class="flex items-center gap-4 mt-2">
          <label><input v-model="wordPairMode" type="checkbox" /> Word Pair Mode</label>
        </div>
      </div>
      <div v-if="wordPairMode" class="mt-4">
        <h3 class="font-bold text-white">
          Word Pair Totals
        </h3>
        <div v-for="(pair, idx) in wordPairs" :key="idx" class="flex items-center gap-4 p-2 mb-1 text-black bg-white rounded">
          <span class="font-bold">{{ pair.join(' + ') }}</span>
          <span>= {{ wordPairTotals[idx] }}</span>
        </div>
      </div>
      <div class="mt-8">
        <h3 class="font-bold text-white">
          Clock View
        </h3>
        <svg viewBox="0 0 200 200" class="w-64 h-64 mx-auto mt-4 bg-white rounded-full">
          <circle cx="100" cy="100" r="95" stroke="black" stroke-width="2" fill="white" />
          <!-- Clock hands -->
          <line
            :x1="100"
            :y1="100"
            :x2="100 + 40 * Math.cos(((clockHourHand + clockMinuteHand / 60) * 15 - 90) * Math.PI / 180)"
            :y2="100 + 40 * Math.sin(((clockHourHand + clockMinuteHand / 60) * 15 - 90) * Math.PI / 180)"
            stroke="black"
            stroke-width="3"
          />
          <line
            :x1="100"
            :y1="100"
            :x2="100 + 60 * Math.cos((clockMinuteHand * 6 - 90) * Math.PI / 180)"
            :y2="100 + 60 * Math.sin((clockMinuteHand * 6 - 90) * Math.PI / 180)"
            stroke="black"
            stroke-width="2"
          />
          <!-- Tick marks for hours -->
          <g v-for="h in 24" :key="`tick-${h}`">
            <line
              :x1="100 + 85 * Math.cos((h * 15 - 90) * Math.PI / 180)"
              :y1="100 + 85 * Math.sin((h * 15 - 90) * Math.PI / 180)"
              :x2="100 + 90 * Math.cos((h * 15 - 90) * Math.PI / 180)"
              :y2="100 + 90 * Math.sin((h * 15 - 90) * Math.PI / 180)"
              stroke="gray"
              stroke-width="1"
            />
          </g>
          <!-- Word/Pairs as dots -->
          <g v-for="(p, i) in clockPoints" :key="`word-${i}`">
            <circle
              :cx="100 + 75 * Math.cos(((p.hour + p.minute / 60) * 15 - 90) * Math.PI / 180)"
              :cy="100 + 75 * Math.sin(((p.hour + p.minute / 60) * 15 - 90) * Math.PI / 180)"
              r="4"
              fill="red"
            />
            <text
              :x="100 + 75 * Math.cos(((p.hour + p.minute / 60) * 15 - 90) * Math.PI / 180) + 6"
              :y="100 + 75 * Math.sin(((p.hour + p.minute / 60) * 15 - 90) * Math.PI / 180) + 4"
              font-size="8"
              fill="black"
            >
              {{ p.label }}
            </text>
          </g>
        </svg>
        <div class="flex justify-center gap-4 mt-2">
          <label>Hour Hand: <input v-model.number="clockHourHand" type="number" class="w-16 text-black" min="0" max="23" /></label>
          <label>Minute Hand: <input v-model.number="clockMinuteHand" type="number" class="w-16 text-black" min="0" max="59" /></label>
        </div>
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

      <div
        v-for="(row, rIdx) in combinedGrid"
        :key="`row-${rIdx}`"
        class="rail-row"
      >
        <span
          v-for="(cell, cIdx) in row"
          :key="`cell-${cIdx}`"
          class="rail-cell"
        >
          <span
            v-if="cell.top && !cell.bottom"
            :class="printMode ? 'text-black' : 'text-lime-300'"
            class="clickable-letter"
            @click="recordSelection(cell.top, rIdx, cIdx)"
          >
            {{ cell.top }}
          </span>
          <span
            v-else-if="cell.bottom && !cell.top"
            class="offset-bottom clickable-letter"
            :class="[printMode ? 'text-black' : 'text-pink-400']"
            @click="recordSelection(cell.bottom, rIdx, cIdx)"
          >
            {{ cell.bottom }}
          </span>
          <span v-else-if="cell.top && cell.bottom">
            <span
              :class="printMode ? 'text-black' : 'text-lime-300'"
              class="clickable-letter"
              @click="recordSelection(cell.top, rIdx, cIdx)"
            >
              {{ cell.top }}
            </span>
            <br />
            <span
              class="offset-bottom clickable-letter"
              :class="[printMode ? 'text-black' : 'text-pink-400']"
              @click="recordSelection(cell.bottom, rIdx, cIdx)"
            >
              {{ cell.bottom }}
            </span>
          </span>
          <span v-else>&nbsp;</span>
        </span>
      </div>
      <div class="pt-6 space-y-2">
        <div class="flex gap-2">
          <button type="button" class="px-3 py-1 text-sm text-black bg-gray-200 rounded" @click="clearSelections">
            Clear Selections
          </button>
          <button type="button" class="px-3 py-1 text-sm text-black bg-gray-200 rounded" @click="removeLast">
            Remove Last Letter
          </button>
        </div>
        <div>
          <label class="block mb-1 text-sm">Selection & Context</label>
          <textarea :value="summaryText" readonly rows="8" class="w-full p-2 font-mono text-black"></textarea>
        </div>
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
