import { ref } from 'vue'

type Handler = (payload?: any) => void
interface Bus {
  on: (event: string, fn: Handler) => void
  off: (event: string, fn: Handler) => void
  emit: (event: string, payload?: any) => void
}

const createBus = (): Bus => {
  const map = new Map<string, Set<Handler>>()
  return {
    on(event, fn) {
      if (!map.has(event))
        map.set(event, new Set())
      map.get(event)!.add(fn)
    },
    off(event, fn) {
      map.get(event)?.delete(fn)
    },
    emit(event, payload) {
      map.get(event)?.forEach((fn) => {
        try { fn(payload) }
        catch {}
      })
    },
  }
}

const bus = ref<Bus>(createBus())
export const useToolBus = () => bus
