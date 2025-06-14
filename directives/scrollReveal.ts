// directives/scrollReveal.ts
import type { DirectiveBinding, ObjectDirective } from 'vue'

const scrollReveal: ObjectDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const delay = binding.value?.delay || 0

    el.classList.add(
      'opacity-0',
      'translate-y-8',
      'transition-all',
      'duration-700',
      'ease-out'
    )

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.remove('opacity-0', 'translate-y-8')
            el.classList.add('opacity-100', 'translate-y-0')
          }, delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(el)
  },

  // SSR shim to prevent Nuxt crash
  getSSRProps() {
    return {}
  }
}

export default scrollReveal