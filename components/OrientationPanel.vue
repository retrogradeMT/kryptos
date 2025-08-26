<template>
  <div class="p-1 mt-2 border border-primary">
    <h2 class="mb-2 text-lg">Orientation</h2>

    <div class="flex flex-col gap-2 text-sm">
      <label class="inline-flex items-center gap-2">
        <input
          type="radio"
          name="orientation"
          value="normal"
          :checked="orientation === 'normal'"
          @change="onChange(($event.target as HTMLInputElement).value as Mode)"
        />
        <span>Normal <span class="opacity-70">(rows unchanged)</span></span>
      </label>

      <label class="inline-flex items-center gap-2">
        <input
          type="radio"
          name="orientation"
          value="tree"
          :checked="orientation === 'tree'"
          @change="onChange(($event.target as HTMLInputElement).value as Mode)"
        />
        <span>TREE <span class="opacity-70">(counter‑clockwise; row&nbsp;1 → col&nbsp;1)</span></span>
      </label>

      <label class="inline-flex items-center gap-2">
        <input
          type="radio"
          name="orientation"
          value="roots"
          :checked="orientation === 'roots'"
          @change="onChange(($event.target as HTMLInputElement).value as Mode)"
        />
        <span>ROOTS <span class="opacity-70">(clockwise; right edge → top)</span></span>
      </label>
    </div>

    <div v-if="showPad" class="mt-3 text-sm">
      <label class="inline-flex items-center gap-2">
        <span>Pad character:</span>
        <input
          class="w-20 px-2 py-1 text-black border border-gray-400 rounded"
          :value="padChar"
          maxlength="1"
          @input="emit('update:padChar', ($event.target as HTMLInputElement).value || ' ')"
        />
        <span class="opacity-70">Used to square ragged rows before rotation</span>
      </label>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * OrientationPanel — shared control for grid orientation.
 *
 * v-model:orientation — 'normal' | 'tree' | 'roots'
 * v-model:padChar     — optional single character used when padding ragged rows
 */

type Mode = 'normal' | 'tree' | 'roots'

const props = withDefaults(defineProps<{
  orientation?: Mode
  padChar?: string
  showPad?: boolean
}>(), {
  orientation: 'normal',
  padChar: ' ',
  showPad: false,
})

const emit = defineEmits<{
  (e: 'update:orientation', v: Mode): void
  (e: 'update:padChar', v: string): void
}>()

const orientation = computed(() => props.orientation)
const padChar = computed(() => props.padChar)
const showPad = computed(() => props.showPad)

function onChange(v: Mode) {
  emit('update:orientation', v)
}
</script>

<style scoped>
</style>
