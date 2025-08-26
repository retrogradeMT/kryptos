<script setup>
import { useScytale } from '~/composables/useScytale'

const { diameter, setDiameter, sweepDiameter } = useScytale()
</script>

<template>
  <div class="p-4 space-y-3 border rounded">
    <label for="diameter" class="block text-sm font-medium text-gray-700">
      Diameter
    </label>
    <input
      id="diameter" type="number" class="block w-full px-2 py-1 mt-1 border rounded" :min="4" :max="40"
      :value="diameter" @input="setDiameter(Number($event.target.value))"
    />

    <button
      type="button" class="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
      @click="sweepDiameter"
    >
      Sweep
    </button>
  </div>
</template>
