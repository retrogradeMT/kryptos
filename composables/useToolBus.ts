import { ref } from 'vue'

const bus = ref<any>(null)

export const useToolBus = () => {
  return bus
}
