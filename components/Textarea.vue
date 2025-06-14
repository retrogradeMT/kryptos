<script>
export default {
  inheritAttrs: false,
}
</script>

<script setup>
// or any key you expect
const props = defineProps({
  errorClass: {
    type: String,
    required: false,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <Field v-slot="{ field }" :name="props.name">
    <textarea
      v-bind="{ ...field, ...$attrs }"
    ></textarea>
  </Field>
  <ErrorMessage :class="props.errorClass" :name="props.name" />
</template>
