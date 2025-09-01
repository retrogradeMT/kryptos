<script setup lang="ts">
/**
 * Presentation component for the Keyword Transposition cipher.  It simply
 * renders the current matrix (left/right or full) and the output matrix.
 * All computation of keys, orders and matrices is handled in the
 * wrapper component; this component is stateless aside from its props.
 */
import { computed } from 'vue'

const props = defineProps({
  dualGrid: { type: Boolean, default: false },
  matrixL: { type: Array, default: () => [] },
  matrixR: { type: Array, default: () => [] },
  matrixFull: { type: Array, default: () => [] },
  columnLabelsLPad: { type: Array, default: () => [] },
  columnLabelsRPad: { type: Array, default: () => [] },
  columnLabelsFullPad: { type: Array, default: () => [] },
  orderL: { type: Array, default: () => [] },
  orderR: { type: Array, default: () => [] },
  orderFull: { type: Array, default: () => [] },
  leftCols: { type: Number, default: 0 },
  rightCols: { type: Number, default: 0 },
  fullCols: { type: Number, default: 0 },
  maxRows: { type: Number, default: 0 },
  // The output matrix and joined string to display in the output section
  outputMatrix: { type: Array, default: () => [] },
  outputJoined: { type: String, default: '' },
  mode: { type: String, default: 'decrypt' },
})

// Helper to get a column from a matrix safely
function columnAt(matrix: any[][], c: number): string[] {
  return matrix.map(row => (row && row[c] !== undefined ? row[c] : ''))
}
</script>

<template>
  <!-- Matrix Preview(s) -->
  <section class="grid gap-4 mt-6" :class="dualGrid ? 'md:grid-cols-2' : 'md:grid-cols-2'">
    <!-- Left or single preview -->
    <div>
      <h3 class="mb-1 font-semibold">
        Matrix Preview — {{ dualGrid ? 'Left Half' : 'Full' }}
      </h3>
      <div class="overflow-auto border">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th v-for="c in (dualGrid ? leftCols : fullCols)" :key="`hL-${c}`" class="px-2 py-1 text-center border-b">
                {{ c }}
              </th>
            </tr>
            <tr>
              <th
                v-for="(lbl, idx) in (dualGrid ? columnLabelsLPad : columnLabelsFullPad)" :key="`kL-${idx}`"
                class="px-2 py-1 text-center text-white border-b bg-zinc-900"
              >
                {{ lbl }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, r) in (dualGrid ? matrixL : matrixFull)" :key="`rL-${r}`">
              <td v-for="(cell, c) in row" :key="`rL-${r}-c-${c}`" class="px-2 py-1 text-center border-b">
                {{ cell || '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Right preview (only in dual) -->
    <div v-if="dualGrid">
      <h3 class="mb-1 font-semibold">
        Matrix Preview — Right Half
      </h3>
      <div class="overflow-auto border">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th v-for="c in rightCols" :key="`hR-${c}`" class="px-2 py-1 text-center border-b">
                {{ c }}
              </th>
            </tr>
            <tr>
              <th
                v-for="(lbl, idx) in columnLabelsRPad" :key="`kR-${idx}`"
                class="px-2 py-1 text-center text-white border-b bg-zinc-900"
              >
                {{ lbl }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, r) in matrixR" :key="`rR-${r}`">
              <td v-for="(cell, c) in row" :key="`rR-${r}-c-${c}`" class="px-2 py-1 text-center border-b">
                {{ cell || '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- Output Section -->
  <section class="mt-6">
    <h3 class="mb-1 font-semibold">
      Output (live)
    </h3>
    <div class="overflow-auto border">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th v-for="c in fullCols" :key="`oh-${c}`" class="px-0 py-1 text-center border-b">
              {{ c }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in outputMatrix" :key="`out-r-${r}`">
            <td v-for="(cell, c) in row" :key="`out-r-${r}-c-${c}`" class="px-0 py-1 text-center border-b">
              {{ cell || '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <label class="block mt-3 mb-1 text-sm font-medium">
      Output (joined — {{ mode === 'decrypt' ? 'rows/plaintext' : 'cols/ciphertext' }})
    </label>
    <textarea :value="outputJoined" rows="6" class="w-full p-2 font-mono text-black border" readonly></textarea>
  </section>
</template>
