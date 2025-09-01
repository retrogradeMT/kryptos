<script lang="ts" setup>
import scytaleWrapper from '~/components/scytaleWrapper.vue'
import { useGlobalState } from '~/composables/useGlobalState'

// The scytale page acts as a thin wrapper around the scytale
// cipher.  It pulls the current text from the global state
// (shared among tools) and passes it into the scytale wrapper.
// No local state is maintained here – all processing happens in
// the wrapper component.
const { currentText } = useGlobalState()
</script>

<template>
  <div class="min-h-full px-4 py-6">
    <h1 class="mb-4 text-2xl font-bold">
      Scytale Cipher
    </h1>
    <scytale-wrapper :input-text="currentText" />
  </div>
</template>
