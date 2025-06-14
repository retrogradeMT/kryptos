<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import * as zod from 'zod'

// Zod Documentation: https://zod.dev/?id=strings

const validationSchema = toTypedSchema(
  zod.object({
    email: zod.string({
      required_error: 'Email is required',
    }).min(1, { message: 'Email is required' }).email({ message: 'Must be a valid email' }),
    name: zod.string({
      required_error: 'Name is required',
    }).min(1, { message: 'Name is required' }),
    phone: zod.string({
      required_error: 'Phone is required',
    }).min(14, { message: 'Valid phone # required' }),
    message: zod.string({
      required_error: 'Message is required',
    }).min(1, { message: 'Message is required' }),
  }),
)

onMounted(() => {
  console.log('Hello world.')
})
</script>

<template>
  <Head>
    <Title>Edge Website - An awesome Edge website</Title>
    <Meta name="description" content="This is an Edge website template" />
    <Link rel="canonical" href="https://edgemarketingdesign.com/" />
  </Head>

  <titleSection
    page="Contact"
    headline="A really great keyword rich headline"
  />

  <div class="container flex flex-col items-center justify-center w-full max-w-6xl px-6 pt-10 pb-64 mx-auto">
    <edge-form-fling
      v-slot="{ submitting }"
      form-fling-endpoint="https://formfling.com/s/KLm807Hz7BXhB8S08uuF-oFPhf8TuWOSPGEmUATyV-2t5gal"
      turnstile-site-secret="0x4AAAAAAANxjIQsY8S7Lqur"
      :validation-schema="validationSchema"
      success-message="Thank you, we will be in touch soon."
      error-message="There was an error submitting the form."
      success-class="text-green-500"
      error-class="text-red-500"
    >
      <Input
        type="text"
        placeholder="Name"
        name="name"
        class="w-full px-4 py-2 border border-gray-300 focus:outline-none"
        error-class="text-sm text-red-500"
      />
      <!-- Email and Phone -->
      <div class="max-w-[400px] my-2 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Input
            type="email"
            placeholder="Email"
            name="email"
            class="w-full px-4 py-2 border border-gray-300 focus:outline-none"
            error-class="text-sm text-red-500"
          />
        </div>
        <div>
          <Input
            type="phone"
            placeholder="Phone"
            name="phone"
            class="w-full px-4 py-2 border border-gray-300 focus:outline-none"
            error-class="text-sm text-red-500"
          />
        </div>
      </div>
      <!-- Message -->
      <div>
        <Textarea
          name="message"
          placeholder="Message"
          class="w-full h-32 px-4 py-2 mt-2 border border-gray-300 resize-none focus:outline-none"
          error-class="text-sm text-red-500"
        />
      </div>
      <div>
        <button v-if="!submitting" type="submit" class="px-6 py-2 mt-2 transition-colors bg-lblue text-dblue hover:bg-opacity-80">
          Send Message
        </button>
        <button v-else type="button" class="px-6 py-2 mt-2 text-gray-500 transition-colors bg-gray-300 cursor-not-allowed">
          Sending...
        </button>
      </div>
    </edge-form-fling>
  </div>
</template>
