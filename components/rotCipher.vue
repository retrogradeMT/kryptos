<script setup>
import { computed } from 'vue'

// Display component for a Caesar/ROT cipher.  When
// `showMapping` is true, it draws two rows: the original
// plaintext and the resulting ciphertext, aligned character by
// character.  Otherwise it prints the output as a single string.
// Cell and font sizes are adjustable for the mapping view.
const props = defineProps({
  output: {
    type: String,
    default: '',
  },
  plain: {
    type: String,
    default: '',
  },
  showMapping: {
    type: Boolean,
    default: false,
  },
  cellSize: {
    type: Number,
    default: 28,
  },
  fontSize: {
    type: Number,
    default: 0,
  },
})

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
  <div>
    <template v-if="props.showMapping">
      <div style="display: flex;">
        <span
          v-for="(ch, idx) in props.plain"
          :key="idx"
          :style="cellStyle"
        >{{ ch }}</span>
      </div>
      <div style="display: flex;">
        <span
          v-for="(ch, idx) in props.plain"
          :key="idx"
          :style="cellStyle"
        >{{ props.output[idx] || '' }}</span>
      </div>
    </template>
    <template v-else>
      <pre class="whitespace-pre-wrap break-all font-mono">{{ props.output }}</pre>
    </template>
  </div>
</template>