import { defineNuxtPlugin } from '#app'
import scrollReveal from '~/directives/scrollReveal'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('scroll-reveal', scrollReveal)
})