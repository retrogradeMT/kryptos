import { ref } from 'vue'

export const useGrid = () => {
  const grid = ref<string[][]>([])
  return grid
}
