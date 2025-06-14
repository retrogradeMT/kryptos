<script>
import { useField } from 'vee-validate'

export default {
  inheritAttrs: false,
}
</script>

<script setup>
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
  type: {
    type: String,
    default: 'text',
  },
})

const model = ref('')
const { handleChange } = useField(props.name)
</script>

defineOptions({ inheritAttrs: false })

<template>
  <Field v-slot="{ field }" :name="props.name">
    <i-mask-input
      v-if="props.type === 'phone'"
      v-model:unmasked="model"
      mask="(000) 000-0000"
      v-bind="{ ...field, ...$attrs }"
    />
    <input
      v-else-if="props.type === 'file'"
      type="file"
      v-bind="{ ...field, ...$attrs }"
      @change="handleChange($event)"
    />
    <input
      v-else
      v-bind="{ ...field, ...$attrs }"
    />
  </Field>
  <ErrorMessage :class="props.errorClass" :name="props.name" />
</template>
