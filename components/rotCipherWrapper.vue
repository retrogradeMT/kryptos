<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import rotCipher from '~/components/rotCipher.vue'

// Wrapper for a ROT/Caesar cipher.  It takes plaintext from a prop
// and allows the user to select a rotation amount.  The cipher
// output updates reactively and is emitted upward via
// `update:output`.  A mapping view can be toggled to align the
// original and shifted characters.
const props = defineProps({
  inputText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{ (e: 'update:output', v: string): void }>()

// Reactive controls for the rotation amount and display options.
const rot = ref(13)
const showMapping = ref(false)
const cellSize = ref(28)
const fontSize = ref(0)

// Plaintext is taken directly from the prop so non‑letters and
// spacing are preserved.
const plain = computed(() => props.inputText)

// Compute the ciphertext by shifting alphabetic characters by
// `rot` positions.  Case is preserved.  Negative rotations are
// supported via modular arithmetic.  Non‑letters are returned
// unchanged.
const output = computed(() => {
  const shift = rot.value % 26
  const text = plain.value
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (/[A-Za-z]/.test(ch)) {
      const isUpper = ch === ch.toUpperCase()
      const base = isUpper ? 65 : 97
      const code = ch.charCodeAt(0) - base
      let newCode = (code + shift)
      // Support negative rotations by wrapping correctly.
      newCode = ((newCode % 26) + 26) % 26
      result += String.fromCharCode(newCode + base)
    }
    else {
      result += ch
    }
  }
  return result
})

// Emit the cipher output upward whenever it changes.
watchEffect(() => {
  emit('update:output', output.value)
})
</script>

<template>
  <div>
    <!-- Controls for rotation and display options -->
    <div class="flex flex-wrap items-center gap-4 mb-4">
      <label class="flex items-center gap-2">Rotation
        <input
          v-model.number="rot"
          type="number"
          class="w-20 text-black"
        />
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="showMapping" /> Show mapping
      </label>
      <label v-if="showMapping" class="flex items-center gap-2">Cell
        <input
          v-model.number="cellSize"
          type="number"
          min="16"
          class="w-16 text-black"
        />
      </label>
      <label v-if="showMapping" class="flex items-center gap-2">Font
        <input
          v-model.number="fontSize"
          type="number"
          min="0"
          class="w-16 text-black"
        />
      </label>
    </div>
    <!-- Render the cipher display -->
    <rot-cipher
      :output="output"
      :plain="plain"
      :show-mapping="showMapping"
      :cell-size="cellSize"
      :font-size="fontSize"
    />
  </div>
</template>