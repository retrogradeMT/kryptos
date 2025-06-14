import { defineNuxtPlugin } from '#app'
import * as rules from '@vee-validate/rules'
import { defineRule } from 'vee-validate'

export default defineNuxtPlugin(() => {
  for (const [ruleName, ruleFn] of Object.entries(rules)) {
    if (typeof ruleFn === 'function') {
      defineRule(ruleName, ruleFn)
    }
  }
})
