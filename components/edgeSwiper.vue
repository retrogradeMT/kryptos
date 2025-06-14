<script setup>
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { onMounted, ref } from 'vue'

const modules = [Navigation, Pagination, Autoplay]

const slides = [
  'https://picsum.photos/id/1018/1200/800',
  'https://picsum.photos/id/1025/1200/800',
  'https://picsum.photos/id/1035/1200/800',
  'https://picsum.photos/id/1043/1200/800',
  'https://picsum.photos/id/1052/1200/800',
]

const swiperRef = ref(null)
</script>

<template>
  <div class="px-4 mx-auto max-w-7xl">
    <div class="relative">
      <!-- Custom Navigation Arrows -->
      <div
        id="swiper-prev"
        class="absolute z-10 text-4xl transform -translate-y-1/2 cursor-pointer top-1/2 -left-6"
      >
        <button class="p-2 bg-white rounded-full shadow hover:bg-gray-200">
          ‹
        </button>
      </div>

      <div
        id="swiper-next"
        class="absolute z-10 transform -translate-y-1/2 cursor-pointer top-1/2 -right-6"
      >
        <button class="p-2 text-4xl bg-white rounded-full shadow hover:bg-gray-200">
          ›
        </button>
      </div>

      <Swiper
        ref="swiperRef"
        :modules="modules"
        :slides-per-view="3"
        :space-between="30"
        :loop="true"
        :autoplay="{ delay: 3000, disableOnInteraction: false }"
        :navigation="{
          nextEl: '#swiper-next',
          prevEl: '#swiper-prev',
        }"
        :pagination="{
          el: '#swiper-pagination',
          clickable: true,
        }"
      >
        <SwiperSlide
          v-for="(img, index) in slides"
          :key="index"
          class="overflow-hidden rounded-lg"
        >
          <img
            :src="img"
            alt="Slide Image"
            class="object-cover w-full h-64"
          />
        </SwiperSlide>
      </Swiper>

      <!-- Pagination below -->
      <div id="swiper-pagination" class="mt-4 text-center"></div>
    </div>
  </div>
</template>