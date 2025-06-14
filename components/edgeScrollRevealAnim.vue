<script setup>
import ScrollReveal from 'scrollreveal'
import { onMounted } from 'vue'

function initObserver() {
  const rows = document.querySelectorAll('.sr-row')

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const row = entry.target
        const delay = Number.parseInt(row.getAttribute('data-sr-delay')) || 0

        ScrollReveal().reveal(row.querySelectorAll('.sr-image'), {
          origin: 'bottom',
          distance: '30px',
          duration: 800,
          delay,
          easing: 'ease-out',
          interval: 200,
          reset: false,
        })

        obs.unobserve(row) // only trigger once
      }
    })
  }, {
    threshold: 0.3, // only trigger when 30% of the row is visible
  })

  rows.forEach(row => observer.observe(row))
}

onMounted(() => {
  initObserver()
})
</script>

<template>
  <div class="max-w-6xl px-4 py-16 mx-auto space-y-12">
    <!-- Row 1 -->
    <div class="grid grid-cols-2 gap-6 md:grid-cols-4 sr-row" data-sr-delay="0">
      <div v-for="i in 4" :key="i" class="overflow-hidden rounded-lg shadow-lg sr-image">
        <img
          :src="`https://picsum.photos/seed/lazyrow1-${i}/400/300`"
          :alt="`Image ${i}`"
          class="object-cover w-full h-auto transition-transform duration-500 hover:scale-105"
        />
      </div>
    </div>

    <!-- Row 2 (delayed reveal) -->
    <div class="grid grid-cols-2 gap-6 md:grid-cols-4 sr-row" data-sr-delay="800">
      <div v-for="i in 4" :key="i" class="overflow-hidden rounded-lg shadow-lg sr-image">
        <img
          :src="`https://picsum.photos/seed/lazyrow2-${i}/400/300`"
          :alt="`Image ${i}`"
          class="object-cover w-full h-auto transition-transform duration-500 hover:scale-105"
        />
      </div>
    </div>
  </div>
</template>