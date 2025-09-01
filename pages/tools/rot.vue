<script lang="ts" setup>
import { useGlobalState } from '~/composables/useGlobalState'
import rotCipherWrapper from '~/components/rotCipherWrapper.vue'

// Thin page for the ROT/Caesar cipher.  It retrieves the
// `currentText` from global state and passes it into the
// wrapper component.  All cipher logic and UI controls live
// inside the wrapper.
const { currentText } = useGlobalState()
</script>

<template>
  <div class="min-h-full px-4 py-6">
    <h1 class="text-2xl font-bold mb-4">ROT/Caesar Cipher</h1>
    <rot-cipher-wrapper :input-text="currentText" />
  </div>
</template>