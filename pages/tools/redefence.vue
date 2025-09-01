<script lang="ts" setup>
import { useGlobalState } from '~/composables/useGlobalState'

// This thin page reads the currentText from the global state and passes it to
// the redefenceWrapper.  The wrapper handles all grid manipulations and
// renders the interactive grid UI.
const { currentText } = useGlobalState()
</script>

<template>
  <div>
    <redefence-wrapper :input-text="currentText" />
  </div>
</template>
