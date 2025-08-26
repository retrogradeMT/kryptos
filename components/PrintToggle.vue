
<template>
  <div class="p-1 mt-2 border border-primary">
    <h2 class="mb-2 text-lg">Print</h2>

    <div class="flex items-center justify-between gap-3 text-sm">
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" :checked="enabled" @change="onToggle(($event.target as HTMLInputElement).checked)" />
        <span>Print‑friendly mode</span>
      </label>

      <div class="flex items-center gap-2">
        <button type="button" class="px-2 py-1" @click="printNow">Open Print Dialog</button>
      </div>
    </div>

    <p class="mt-2 text-xs opacity-70">
      When enabled, pages can add a <code>print</code>‑friendly class or styling (e.g., white background, black text,
      mono fonts). Use the button to invoke the browser print dialog.
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{ enabled?: boolean }>(), { enabled: false })
const emit = defineEmits<{ (e: 'update:enabled', v: boolean): void }>()

function onToggle(v: boolean) {
  emit('update:enabled', v)
}

function printNow() {
  try { window.print() } catch {}
}

const enabled = computed(() => props.enabled)
</script>

<style scoped>
</style>
