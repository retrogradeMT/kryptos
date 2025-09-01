<script setup lang="ts">
import { computed } from 'vue'

// This display component renders the result of a Vigenère cipher
// transformation.  When `showKey` is true, it draws three rows:
// one for the repeated keyword, one for the original plaintext and one
// for the resulting ciphertext.  Otherwise it simply prints the
// output string in a preformatted block.  Cell sizing can be
// customised via `cellSize` and `fontSize` props.
const props = defineProps({
  output: {
    type: String,
    default: '',
  },
  plain: {
    type: String,
    default: '',
  },
  keyword: {
    type: String,
    default: '',
  },
  showKey: {
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

// Compute a style object for each cell.  If the user provides
// `fontSize` then that value is used directly; otherwise the
// font size scales with the cell size.  The Kryptos Sculpture
// font is used to match the other cipher displays.
const cellStyle = computed(() => {
  const size = props.cellSize
  const fontSz = props.fontSize > 0 ? props.fontSize : size * 0.8
  return {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '\'Kryptos Sculpture\', monospace',
    fontSize: `${fontSz}px`,
    lineHeight: 1,
  }
})

// When showing the keyword, we need to align the repeated keyword with
// letters in the plaintext.  Non‑letters in the plaintext are
// preserved in place and do not advance the keyword index.  This
// computed array builds an object for each character containing
// the plaintext letter, the keyword letter (or empty string for
// non‑letters) and the corresponding cipher letter.
const aligned = computed(() => {
  const plain = props.plain
  const keyword = props.keyword
  const output = props.output
  if (!plain)
    return []
  let keyPos = 0
  const arr: { plain: string, keyword: string, cipher: string }[] = []
  for (let i = 0; i < plain.length; i++) {
    const ch = plain[i]
    const isLetter = /[A-Z]/i.test(ch)
    let kChar = ''
    if (isLetter && keyword.length > 0) {
      kChar = keyword[keyPos % keyword.length]
      keyPos++
    }
    arr.push({ plain: ch, keyword: kChar, cipher: output[i] || '' })
  }
  return arr
})
</script>

<template>
  <div>
    <!-- When showKey is true, render keyword/plain/cipher rows with aligned cells -->
    <template v-if="props.showKey">
      <div style="display: flex;" class="divide-y">
        <span v-for="(item, idx) in aligned" :key="idx" :style="cellStyle" class="uppercase">
          {{ item.keyword || ' ' }}
        </span>
      </div>

      <div style="display: flex;">
        <span v-for="(item, idx) in aligned" :key="idx" :style="cellStyle">
          {{ item.plain }}
        </span>
      </div>
      <div style="display: flex;">
        <span v-for="(item, idx) in aligned" :key="idx" :style="cellStyle">
          {{ item.cipher }}
        </span>
      </div>
    </template>
    <!-- Otherwise just display the output as plain text -->
    <template v-else>
      <pre class="font-mono break-all whitespace-pre-wrap">{{ props.output }}</pre>
    </template>
  </div>
</template>
