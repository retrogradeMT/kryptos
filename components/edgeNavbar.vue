<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const menuOpen = ref(false)

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    document.body.classList.add('overflow-hidden') // Prevent scrolling when open
  }
  else {
    document.body.classList.remove('overflow-hidden')
  }
}

// Automatically close the menu when clicking a link
const closeMenu = () => {
  menuOpen.value = false
  document.body.classList.remove('overflow-hidden')
}

// Ensure the menu closes when resizing back to desktop
const handleResize = () => {
  if (window.innerWidth >= 1024) {
    closeMenu()
  }
}

// Listen for window resize events
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <nav class="relative z-30 text-white">
    <!-- Navigation Content (Top Half) -->
    <div class="relative px-6 md:px-12 bg-dblue">
      <div class="container mx-auto flex items-center justify-between h-[128px]">
        <!-- Logo -->
        <NuxtLink to="/" class="text-xl font-bold">
          <img src="/images/logo.png" alt="MT" class="w-full h-auto" />
        </NuxtLink>

        <!-- Mobile Menu Button -->
        <button class="md:hidden focus:outline-none" @click="toggleMenu">
          <svg v-if="!menuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Desktop Menu -->
        <ul class="hidden md:flex space-x-[30px] font-semibold tracking-widest uppercase">
          <li>
            <NuxtLink to="/" class="nav-item">
              Home
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/stuff" class="nav-item">
              Stuff
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/contact" class="nav-item">
              Contact
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- Mobile Slide-in Menu -->
    <transition name="slide">
      <div v-if="menuOpen" class="fixed inset-0 flex flex-col items-center justify-center px-20 py-6 text-center bg-dblue z-[9999] w-full h-full">
        <!-- Close Button -->
        <button class="absolute text-4xl top-6 right-6 text-lblue" @click="toggleMenu">
          &times;
        </button>

        <!-- Mobile Logo -->
        <a href="/"><img src="/images/logo.png" alt="Logo" class="mb-4 w-50" /></a>

        <!-- Social Media Icons -->
        <div class="flex justify-center my-6 space-x-4">
          <a href="#" class="flex items-center justify-center w-12 h-12 transition rounded-full bg-lblue text-dblue hover:bg-opacity-80">
            <i class="fab fa-facebook-f fa-lg"></i>
          </a>
          <a href="#" class="flex items-center justify-center w-12 h-12 transition rounded-full bg-lblue text-dblue hover:bg-opacity-80">
            <i class="fab fa-instagram fa-lg"></i>
          </a>
          <a href="#" class="flex items-center justify-center w-12 h-12 transition rounded-full bg-lblue text-dblue hover:bg-opacity-80">
            <i class="fab fa-houzz fa-lg"></i> <!-- Houzz or custom icon -->
          </a>
        </div>

        <!-- Mobile Menu Items -->
        <ul class="w-full">
          <li class="border-t border-lblue">
            <NuxtLink to="/" class="text-lg tracking-widest uppercase" @click="closeMenu">
              Home
            </NuxtLink>
          </li>
          <li class="border-t border-b border-lblue">
            <NuxtLink to="/stuff" class="text-lg tracking-widest uppercase" @click="closeMenu">
              Stuff
            </NuxtLink>
          </li>
          <li class="border-t border-b border-lblue">
            <NuxtLink to="/contact" class="text-lg tracking-widest uppercase" @click="closeMenu">
              Contact
            </NuxtLink>
          </li>
        </ul>

        <!-- Call to Action Section -->
        <div class="mt-8 text-center">
          <h2 class="text-3xl font-bold tracking-widest uppercase text-lblue">
            Stuff
          </h2>
          <p class="mt-2 text-white">
            More stuff here
          </p>
          <NuxtLink to="/contact" class="inline-block px-10 py-4 mt-4 text-lg font-bold tracking-widest underline uppercase transition text-dblue bg-burntorange hover:bg-opacity-80" @click="closeMenu">
            Contact Us
          </NuxtLink>
        </div>
      </div>
    </transition>
  </nav>
</template>

 <style>
 /* Mobile slide-in transition */
 .slide-enter-active,
 .slide-leave-active {
   transition: transform 0.3s ease-in-out;
 }
 .slide-enter-from,
 .slide-leave-to {
   transform: translateX(100%);
 }

 /* Navigation Items with Triangle */
 .nav-item {
   position: relative;

   transition: color 0.3s ease-in-out;
 }

 /* Hover Effect */
 .nav-item:hover {
   color: #A2A8AE; /* Accent color on hover */
 }

 .nav-item:hover::after {
   transform: scale(1.3); /* Triangle expands */
   background-color: white; /* Changes color slightly */
 }

 /* Active State */
 .nav-item.router-link-active {
   color: white;
   font-weight: bold;
 }

 .nav-item.router-link-active {
  color: #A2A8AE;
 }
 </style>
