import { ref } from 'vue'

export const useRails = () => {
  const rails = ref<number>(0)
  return rails
}
