import { ref } from 'vue'

export const useCipherState = () => {
  const cipherText = ref<string>('')
  const key = ref<string>('')

  return { cipherText, key }
}
