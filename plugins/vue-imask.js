import { defineNuxtPlugin } from '#app'
import { IMaskComponent } from 'vue-imask'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('IMaskInput', IMaskComponent)
})
