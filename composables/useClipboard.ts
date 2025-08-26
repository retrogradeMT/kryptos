import { ref } from 'vue'

export const useClipboard = () => {
  const clipboard = ref<string>('')

  const copy = (text: string) => {
    clipboard.value = text
    navigator.clipboard?.writeText(text)
  }

  return { clipboard, copy }
}
