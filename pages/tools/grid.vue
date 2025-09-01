<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { useGlobalState } from '~/composables/useGlobalState'

const { currentText } = useGlobalState()
</script>

<template>
  <div>
    <gridWrapper :input-text="currentText" />
  </div>
</template>
