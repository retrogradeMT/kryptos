<script>
export default {
  inheritAttrs: false,
}
</script>

<script setup>
const props = defineProps({
  errorClass: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
    // Example format: [{ label: 'Option 1', value: '1' }]
  },
})
</script>

<template>
  <Field v-slot="{ field }" :name="props.name">
    <select v-bind="{ ...field, ...$attrs }">
      <option v-for="option in props.options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </Field>
  <ErrorMessage :class="props.errorClass" :name="props.name" />
</template>
