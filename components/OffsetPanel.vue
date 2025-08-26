<template>
  <div class="p-1 mt-2 border border-primary">
    <h2 class="mb-2 text-lg">Offsets</h2>

    <div class="flex flex-col gap-3 text-sm">
      <div class="flex items-center gap-2">
        <label class="w-28">Offset</label>
        <input
          class="w-24 p-1 text-black border border-gray-400 rounded"
          type="number"
          :value="offset"
          @input="emit('update:offset', toNum(($event.target as HTMLInputElement).value))"
        />
      </div>

      <div class="flex items-center gap-2">
        <label class="inline-flex items-center gap-2">
          <input type="checkbox" :checked="stackReversedRail" @change="emit('update:stackReversedRail', ($event.target as HTMLInputElement).checked)" />
          <span>Stack Reversed Rail</span>
        </label>
      </div>

      <div v-if="stackReversedRail" class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <label class="w-28">Reverse Rail Offset</label>
          <input
            class="w-24 p-1 text-black border border-gray-400 rounded"
            type="number"
            :value="reverseRailOffset"
            @input="emit('update:reverseRailOffset', toNum(($event.target as HTMLInputElement).value))"
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="w-28">Visual Shift</label>
          <input
            class="w-24 p-1 text-black border border-gray-400 rounded"
            type="number"
            :value="visualShift"
            @input="emit('update:visualShift', toNum(($event.target as HTMLInputElement).value))"
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="w-28">Reverse Visual</label>
          <input
            class="w-24 p-1 text-black border border-gray-400 rounded"
            type="number"
            :value="reverseVisualShift"
            @input="emit('update:reverseVisualShift', toNum(($event.target as HTMLInputElement).value))"
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="w-28">Vertical Stack</label>
          <input
            class="w-24 p-1 text-black border border-gray-400 rounded"
            type="number"
            :value="verticalStackOffset"
            @input="emit('update:verticalStackOffset', toNum(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>

      <div class="flex gap-2">
        <button class="px-2 py-1 text-sm" @click="reset">Reset</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * OffsetPanel — railsalt-compatible offsets and stacking controls.
 *
 * v-model:offset
 * v-model:stackReversedRail
 * v-model:reverseRailOffset
 * v-model:visualShift
 * v-model:reverseVisualShift
 * v-model:verticalStackOffset
 */

const props = withDefaults(defineProps<{
  offset?: number
  stackReversedRail?: boolean
  reverseRailOffset?: number
  visualShift?: number
  reverseVisualShift?: number
  verticalStackOffset?: number
}>(), {
  offset: 0,
  stackReversedRail: false,
  reverseRailOffset: 0,
  visualShift: 0,
  reverseVisualShift: 0,
  verticalStackOffset: 0,
})

const emit = defineEmits<{
  (e: 'update:offset', v: number): void
  (e: 'update:stackReversedRail', v: boolean): void
  (e: 'update:reverseRailOffset', v: number): void
  (e: 'update:visualShift', v: number): void
  (e: 'update:reverseVisualShift', v: number): void
  (e: 'update:verticalStackOffset', v: number): void
}>()

const offset = computed(() => props.offset)
const stackReversedRail = computed(() => props.stackReversedRail)
const reverseRailOffset = computed(() => props.reverseRailOffset)
const visualShift = computed(() => props.visualShift)
const reverseVisualShift = computed(() => props.reverseVisualShift)
const verticalStackOffset = computed(() => props.verticalStackOffset)

function toNum(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function reset() {
  emit('update:offset', 0)
  emit('update:reverseRailOffset', 0)
  emit('update:visualShift', 0)
  emit('update:reverseVisualShift', 0)
  emit('update:verticalStackOffset', 0)
  emit('update:stackReversedRail', false)
}
</script>

<style scoped>
</style>
