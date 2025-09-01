<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'

// This wrapper implements the Vigenère cipher.  It accepts
// plaintext via a prop and exposes controls for the cipher key
// and mode (encrypt/decrypt).  Whenever the plaintext, key or
// mode changes, the wrapper recomputes the output and emits it
// upward as `update:output`.
const props = defineProps({
  inputText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{ (e: 'update:output', v: string): void }>()

// Reactive settings.  Users can enter a keyword, choose to encrypt
// or decrypt, and toggle whether to display the keyword alignment
// grid.  They can also adjust cell and font sizes when the
// keyword alignment grid is shown.
const keyword = ref('KEYWORD')
const mode = ref<'encrypt' | 'decrypt'>('encrypt')
const showKey = ref(false)
const cellSize = ref(28)
const fontSize = ref(0)

// Clean the input.  We operate directly on the prop so that
// non‑letters are preserved in their positions.  We avoid
// stripping spaces so that the keyword alignment remains obvious.
const plain = computed(() => props.inputText)

// Precompute the numeric shifts for each letter in the keyword.  A
// letter maps to 0–25 based on its position in the alphabet.
const keyShifts = computed(() => {
  const arr: number[] = []
  for (const ch of keyword.value.toUpperCase()) {
    if (/[A-Z]/.test(ch))
      arr.push(ch.charCodeAt(0) - 65)
  }
  return arr.length > 0 ? arr : [0]
})

// Core transformation.  Walk the plaintext and apply the
// Vigenère shift or its inverse when encountering letters.  The
// keyword position only advances on letters; all other characters
// pass through unchanged.
const output = computed(() => {
  const text = plain.value
  const shifts = keyShifts.value
  const decrypt = mode.value === 'decrypt'
  let keyPos = 0
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (/[A-Z]/i.test(ch)) {
      const isUpper = ch === ch.toUpperCase()
      const base = isUpper ? 65 : 97
      const chCode = ch.charCodeAt(0) - base
      const shift = shifts[keyPos % shifts.length]
      const newCode = decrypt
        ? (chCode - shift + 26) % 26
        : (chCode + shift) % 26
      result += String.fromCharCode(newCode + base)
      keyPos++
    }
    else {
      result += ch
    }
  }
  return result
})

// Emit the output string whenever it changes.  This allows
// downstream components to capture the cipher result.
watchEffect(() => {
  emit('update:output', output.value)
})
</script>

<template>
  <div>
    <!-- Cipher controls: keyword, mode selection, show/hide keyword alignment, and sizing -->
    <div class="flex flex-wrap items-center gap-4 mb-4">
      <label class="flex items-center gap-2">
        Key
        <input v-model="keyword" type="text" class="w-32 text-black" />
      </label>
      <label class="flex items-center gap-2">
        Mode
        <select v-model="mode" class="text-black">
          <option value="encrypt">Encrypt</option>
          <option value="decrypt">Decrypt</option>
        </select>
      </label>
      <label class="flex items-center gap-2">
        <input v-model="showKey" type="checkbox" /> Show key alignment
      </label>
      <label v-if="showKey" class="flex items-center gap-2">
        Cell
        <input v-model.number="cellSize" type="number" min="16" class="w-16 text-black" />
      </label>
      <label v-if="showKey" class="flex items-center gap-2">
        Font
        <input v-model.number="fontSize" type="number" min="0" class="w-16 text-black" />
      </label>
    </div>
    <!-- Render the Vigenère display.  When showKey is enabled, we
         pass plain and keyword for alignment; otherwise we just
         display the output text. -->
    <vigenere
      :keyword="keyword"
      :output="output"
      :plain="plain"
      :show-key="showKey"
      :cell-size="cellSize"
      :font-size="fontSize"
    />
  </div>
</template>
