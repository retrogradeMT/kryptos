<script setup>
import { Fancybox } from '@fancyapps/ui'
import { onMounted } from 'vue'

const images = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  src: `https://picsum.photos/seed/masonry${i}/600/400`,
  alt: `Random Image ${i + 1}`,
}))

onMounted(() => {
  Fancybox.bind('[data-fancybox="gallery"]', {})
})
</script>

<template>
  <div class="gap-4 p-4 columns-1 sm:columns-2 md:columns-3 lg:columns-4">
    <a
      v-for="image in images"
      :key="image.id"
      :href="image.src"
      data-fancybox="gallery"
      :data-caption="image.alt"
      class="block mb-4 overflow-hidden transition rounded-lg hover:opacity-80"
    >
      <img
        :src="image.src"
        :alt="image.alt"
        class="w-full h-auto rounded shadow"
      />
    </a>
  </div>
</template>