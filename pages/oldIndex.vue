<script setup>
import { computed, ref } from 'vue'

// const wordInputs = ref([
//   'ENOITISOP',
//   'EEEEEEINVISIBLE',
//   'INTERPRETATIO',
//   'EEEDICUL',
//   'EEWODAHSEE',
//   'EEVIRTUALLYE',
//   'EYROMEM',
//   'EDIGETALEEE',
//   'RQ',
//   'SOS',
//   'EEEEESECROF',
//   'RUOYSIT',
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
const wordInputs = ref([
  'VIRTUALLY',
  'INVISIBLE',
  'DIGITAL',
  'INTERPRETATIO',
  'TISYOUR',
  'LUCID',
  'SHADOW',
  'POSITION',
  'MEMORY',
  'FORCES',

])

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

const displayText = computed(() => {
  const outputString = wrappedGrid.value
    .map(row => row.map(cell => cell.char).join(''))
    .join('')
  return outputString.replace(/\./g, '').toLowerCase()
})

const flatText = computed(() => wordInputs.value.join(''))

const letterColorMap = computed(() => {
  const map = []
  wordInputs.value.forEach((word, wordIdx) => {
    for (let i = 0; i < word.length; i++) {
      map.push(wordColors[wordIdx])
    }
  })
  return map
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

function handleCellClick(cell) {
  const key = `${cell.row}-${cell.col}`
  const idx = selectedCells.value.findIndex(c => c.key === key)
  if (idx === -1) {
    selectedCells.value.push({
      key,
      char: cell.char,
      row: cell.row,
      col: cell.col,
      order: selectedCells.value.length + 1,
    })
  }
  else {
    selectedCells.value.splice(idx, 1)
    // Recompute order
    selectedCells.value.forEach((c, i) => {
      c.order = i + 1
    })
  }
}

const wrappedGrid = computed(() => {
  const rows = Math.ceil(flatText.value.length / diameter.value)
  const rotated = flatText.value.slice(offset.value) + flatText.value.slice(0, offset.value)
  const padded = rotated.padEnd(rows * diameter.value, '.')

  const colorRotated = [
    ...letterColorMap.value.slice(offset.value),
    ...letterColorMap.value.slice(0, offset.value),
  ]
  const colorPadded = [...colorRotated, ...Array.from({ length: rows * diameter.value - colorRotated.length }).fill('#ffffff')]

  const grid = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < diameter.value; c++) {
      const idx = r + c * rows
      row.push({ char: padded[idx], color: colorPadded[idx], row: r, col: c })
    }
    grid.push(row)
  }

  let finalGrid = [...grid]
  if (reverseRows.value) {
    finalGrid = finalGrid.map(row => row.reverse())
  }
  if (reverseColumns.value) {
    finalGrid = finalGrid.reverse()
  }

  return finalGrid
})

const transpositionRows = computed(() => {
  const text = flatText.value.padEnd(Math.ceil(flatText.value.length / tineLength.value) * tineLength.value, '.')
  const rows = []
  for (let i = 0; i < text.length; i += tineLength.value) {
    rows.push(text.slice(i, i + tineLength.value).split(''))
  }
  return rows
})

const selectedTrailText = computed(() =>
  selectedCells.value
    .sort((a, b) => a.order - b.order)
    .map(c => c.char)
    .join('')
)
</script>

<template>
  <div class="flex flex-col min-h-screen p-8 text-white bg-gray-900">
    <h1 class="mb-6 text-3xl">
      Scytale Cipher Visualizer
    </h1>

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
    <div class="flex flex-col gap-4 align-top">
      <div class=" font-mono text-2xl border min-w-[33%] border-primary">
        <div v-for="(row, idx) in wrappedGrid" :key="idx" class="flex">
          <span
            v-for="(cell, cidx) in row"
            :key="cidx"
            class="px-2 py-1 cursor-pointer"
            :style="{
              color: cell.color,
              backgroundColor: selectedCells.find(c => c.key === `${cell.row}-${cell.col}`) ? '#fff3e0' : 'transparent',
              border: selectedCells.find(c => c.key === `${cell.row}-${cell.col}`) ? '1px solid orange' : 'none',
            }"
            @click="handleCellClick(cell)"
          >
            {{ cell.char }}
          </span>
        </div>
      </div>
      <div class="p-4 mt-8 border border-primary">
        <h3 class="mb-2 text-xl">
          Rail Reading Details
        </h3>
        <div class="p-4">
          <div class="flex flex-wrap gap-2 text-xl">
            <div v-for="(cell, idx) in selectedCells" :key="cell.key" class="px-2 py-1 text-black bg-white border border-gray-600 rounded">
              {{ cell.char }} ({{ cell.row }},{{ cell.col }}) #{{ cell.order }}
            </div>
          </div>
          <div class="mt-4 p-2 text-lg text-yellow-300 bg-gray-800 rounded">
            Trail Preview: {{ selectedTrailText }}
          </div>
        </div>
      </div>
      <div class="p-4 mt-8 border border-primary">
        <h3 class="mb-2 text-xl">
          Transposition Grid
        </h3>
        <div class="mb-4">
          <label for="tineLengthInput">Transposition Shift Length:</label>
          <input id="tineLengthInput" v-model="tineLength" type="number" class="w-20 p-1 ml-2 text-black" min="1" />
        </div>
        <div class="font-mono text-2xl border min-w-[33%] border-primary">
          <div v-for="(row, idx) in transpositionRows" :key="idx" class="flex">
            <span
              v-for="(char, cidx) in row"
              :key="cidx"
              class="px-2 py-1 text-white"
            >
              {{ char }}
            </span>
          </div>
        </div>
      </div>

      <!-- <div class="p-4 mt-8 border border-primary">
        <h3 class="mb-2 text-xl">
          Word Break Attempt:
        </h3>
        <div class="p-4">
          <div v-if="wordScanHits !== 'No word hits'">
            <div v-for="hit in wordScanHits" :key="hit.word + hit.position">
              Word: {{ hit.word }} at position {{ hit.position }}
            </div>
          </div>
          <div v-else>
            No word hits found
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
          <button
            :disabled="index === wordInputs.length - 1" class="px-2 bg-blue-600 rounded"
            @click="() => moveDown(index)"
          >
            ↓
          </button>
        </div>
      </div> -->
      <div v-if="diameterScanResults.length" class="p-4 mt-8 border border-primary">
        <h3 class="mb-2 text-lg">
          Diameter Sweep Results:
        </h3>
        <div v-for="res in diameterScanResults" :key="res.diameter">
          Diameter {{ res.diameter }}: {{ res.hits }} word hits
        </div>
      </div>
      <div class="p-4 border border-primary">
        <h3 class="mb-2 text-xl">
          Partial Hits:
        </h3>
        <div v-if="partialHits !== 'No partial word hits'">
          <div v-for="hit in partialHits" :key="hit.word + hit.partial + hit.position">
            Word: {{ hit.word }} includes '{{ hit.partial }}' at position {{ hit.position }}
          </div>
        </div>
        <div v-else>
          No partial word hits found
        </div>
      </div>
    </div>
  </div>
</template>
