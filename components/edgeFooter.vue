<template>
  <footer class="flex flex-col items-center justify-center bg-black">
    <div class="text-center">
      <!-- Social Icons -->
      <div class="flex justify-center mb-6 space-x-4">
        <a
          href="#"
          class="flex items-center justify-center w-12 h-12 transition rounded-full bg-lblue text-dblue hover:bg-opacity-80"
        >
          <i class="fab fa-facebook-f fa-lg"></i>
        </a>
        <a
          href="#"
          class="flex items-center justify-center w-12 h-12 transition rounded-full bg-lblue text-dblue hover:bg-opacity-80"
        >
          <i class="fab fa-instagram fa-lg"></i>
        </a>
        <a
          href="#"
          class="flex items-center justify-center w-12 h-12 transition rounded-full bg-lblue text-dblue hover:bg-opacity-80"
        >
          <i class="fab fa-houzz fa-lg"></i> <!-- Houzz or custom icon -->
        </a>
      </div>

      <!-- Contact Information -->
      <div
        class="mb-8 text-sm font-medium tracking-wide text-center uppercase text-lblue md:flex md:justify-center md:space-x-8 md:space-y-0"
      >
        <div>
          <a href="tel:+19999999"><span
            class="font-serif font-bold tracking-wider text-white"
          >Office</span> 999.999.9999</a>
        </div>
        <div>
          <span class="font-serif font-bold tracking-wider text-white">Mail</span> Mailing Address
        </div>
        <div>
          <span class="font-serif font-bold tracking-wider text-white">Other Info</span> Other Info
        </div>
      </div>

      <!-- Logo -->
      <div class="flex justify-center">
        <img src="/images/logo.png" alt="Logo" class="h-auto opacity-75 w-46" />
      </div>
    </div>
  </footer>
</template>

<style scoped>
</style>
