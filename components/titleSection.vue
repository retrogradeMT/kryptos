<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  page: {
    type: String,
    required: false,
    default: '',
  },
  headline: {
    type: String,
    required: false,
    default: '',
  },
})

const isVisible = ref(false)

onMounted(() => {
  // Trigger animation on load
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})
</script>

<template>
  <section class="relative flex items-center px-12 py-20 text-white bg-gray-900 md:px-72">
    <div
      class="container relative max-w-6xl m-auto text-left transition-all duration-700 ease-out"
      :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      <h6
        class="inline-flex items-center gap-2 mb-4 transition-all duration-700 ease-out super-head"
        :class="isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'"
      >
        {{ page }}
      </h6>
      <h1
        class="text-3xl font-light !leading-tight font-fancy md:text-5xl md:pr-80 transition-all duration-700 ease-out delay-100"
        :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        {{ headline }}
      </h1>
    </div>
  </section>
</template>
