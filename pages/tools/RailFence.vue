<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import PageTitle from '~/components/PageTitle.vue'

const text = useStorage('payload:text', '')
</script>

<template>
  <div class="px-4 py-6">
    <PageTitle title="Rail Fence" />
    <div class="mt-4">
      <label class="block mb-1 text-sm font-medium">Input (shared selection)</label>
      <textarea v-model="text" rows="6" class="w-full p-2 font-mono text-black border"></textarea>
      <p class="mt-1 text-xs opacity-70">
        This starts with the shared selection from the Tools dashboard.
      </p>
    </div>
  </div>
</template>

<style scoped></style>
