<script lang="ts" setup>
// Thin page for the keyword transposition tool.  It reads the current
// text from the global state and passes it down to the wrapper
// component.  All cipher logic and display lives in the wrapper and
// presentation components.
import { useGlobalState } from '~/composables/useGlobalState'

const { currentText } = useGlobalState()
</script>

<template>
  <div>
    <keyword-transposition-wrapper :input-text="currentText" />
  </div>
</template>

<style scoped></style>
