// Minimal, tree-shakable defaults registry.
// You can later split these into /assets/data/*.json if you prefer.

import { computed } from 'vue'

type Defaults = {
  copperplateText: string,               // Full grid (paste yours here)
  morseWordsInputs: string[],
  morseWordsInputsWithE: string[],
}

const defaults: Defaults = {
  // leave blank so you can paste your copperplate once; we treat "" as “not set”
  copperplateText: '',

  morseWordsInputs: [
    'VIRTUALLY',
    'INTERPRETATIU',
    'INVISIBLE',
    'TISYOUR',
    'LUCID',
    'SHADOW',
    'POSITION',
    'MEMORY',
    'FORCES',
    'DIGITAL',
  ],

  morseWordsInputsWithE: [
    'EEVIRTUALLYE',
    'EEEEEEINVISIBLE',
    'EESHADOWEE',
    'FORCESEEEEE',
    'LUCIDEEE',
    'MEMORYE',
    'RQ',
    'SOS',
    'EDIGETALEEE',
    'INTERPRETATIO',
    'TISYOUR',
    'POSITIONE',
  ],
}

export function useDefaults() {
  // expose as readonly/computed in case you later make them reactive
  const copperplateText = computed(() => defaults.copperplateText)
  const morseWordsInputs = computed(() => defaults.morseWordsInputs)
  const morseWordsInputsWithE = computed(() => defaults.morseWordsInputsWithE)

  /**
   * Convenience helper: if `target.value` is empty and there's no ?text= in URL,
   * fill it with a known default. Return true if applied.
   */
  function applyDefaultIfEmpty(opts: {
    target: { value: string },
    source: 'copperplate' | 'morse:plain' | 'morse:withE',
    routeQuery?: Record<string, any>
  }): boolean {
    const { target, source, routeQuery } = opts
    const hasQueryText = !!(routeQuery && typeof routeQuery.text === 'string' && routeQuery.text.length)
    if (hasQueryText || (target.value && target.value.trim().length)) return false

    if (source === 'copperplate' && copperplateText.value) {
      // When provided via composable, use as-is; do NOT trim or modify spacing.
      target.value = copperplateText.value
      return true
    }
    // Otherwise, copperplate defaults are provided via the page’s hidden <textarea> seed

    if (source === 'morse:plain') {
      target.value = morseWordsInputs.value.join('\n')
      return true
    }
    if (source === 'morse:withE') {
      target.value = morseWordsInputsWithE.value.join('\n')
      return true
    }
    return false
  }

  return {
    copperplateText,
    morseWordsInputs,
    morseWordsInputsWithE,
    applyDefaultIfEmpty,
  }
}
