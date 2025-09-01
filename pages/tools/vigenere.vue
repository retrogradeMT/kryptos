<script lang="ts" setup>
import vigenereWrapper from '~/components/vigenereWrapper.vue'
import { useGlobalState } from '~/composables/useGlobalState'

// Thin page for the Vigenère cipher.  It consumes the current
// text from the global state and passes it into the wrapper.
const { currentText } = useGlobalState()
</script>

<template>
  <div class="min-h-full px-4 py-6">
    <h1 class="mb-4 text-2xl font-bold">
      Vigenère Cipher
    </h1>
    <vigenere-wrapper :input-text="currentText" />
  </div>
</template>
