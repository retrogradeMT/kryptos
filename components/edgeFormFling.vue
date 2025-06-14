<script setup>
import VueTurnstile from 'vue-turnstile'

const props = defineProps({
  validationSchema: {
    type: Object,
    required: true,
  },
  formFlingEndpoint: {
    type: String,
    required: true,
  },
  turnstileSiteSecret: {
    type: String,
    required: false,
  },
  turnstileTheme: {
    type: String,
    required: false,
    default: 'light',
  },
  successMessage: {
    type: String,
    required: false,
    default: 'Form submitted successfully!',
  },
  errorMessage: {
    type: String,
    required: false,
    default: 'Submission failed, please try again.',
  },
  successClass: {
    type: String,
    required: false,
    default: 'text-green-500 mt-2',
  },
  errorClass: {
    type: String,
    required: false,
    default: 'text-red-500 mt-2',
  },
})

const state = reactive({
  submitting: false,
  turnstileToken: '',
  submitResponse: {
    sent: false,
    success: false,
    message: '',
  },
})

const onSubmit = async (values, { resetForm }) => {
  state.submitting = true
  state.submitResponse.sent = false

  try {
    const formData = new FormData()

    for (const key in values) {
      const value = values[key]

      if (value instanceof File) {
        formData.append(key, value)
      }
      else if (Array.isArray(value) && value.every(v => v instanceof File)) {
        value.forEach((file, i) => {
          formData.append(`${key}[${i}]`, file)
        })
      }
      else {
        formData.append(key, value)
      }
    }

    if (state.turnstileToken) {
      formData.append('cf-turnstile-response', state.turnstileToken)
    }

    const response = await fetch(props.formFlingEndpoint, {
      method: 'POST',
      body: formData,
    })

    state.submitResponse.sent = true

    if (!response.ok) {
      state.submitResponse.success = false
      state.submitResponse.message = props.errorMessage
      return
    }

    const data = await response.json()

    let success = true
    let errorMessage = props.successMessage

    if (Array.isArray(data)) {
      for (const step of data) {
        if (!step.response.success) {
          success = false
          errorMessage = props.errorMessage
          break
        }
      }
    }

    state.submitResponse.success = success
    state.submitResponse.message = errorMessage
  }
  catch (err) {
    console.log(err)
    state.submitResponse.success = false
    state.submitResponse.message = props.errorMessage
  }
  finally {
    state.submitting = false
  }
  if (state.submitResponse.success) {
    resetForm()
  }
}
</script>

<template>
  <Form
    :validation-schema="props.validationSchema"
    @submit="onSubmit"
  >
    <slot :submitting="state.submitting" :submit-response="state.submitResponse"></slot>
    <VueTurnstile
      v-if="props.turnstileSiteSecret"
      v-model="state.turnstileToken"
      :site-key="props.turnstileSiteSecret"
      :theme="props.turnstileTheme"
    />
    <div v-if="state.submitResponse.sent" :class="state.submitResponse.success ? props.successClass : props.errorClass">
      {{ state.submitResponse.message }}
    </div>
  </Form>
</template>
