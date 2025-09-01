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

import { useStorage } from '@vueuse/core'

// History snapshot interface
export interface Snapshot {
  id: number
  timestamp: number
  text: string
  tool?: string
  note?: string
}

/**
 * Global text state + localStorage‑backed history
 */
export function useGlobalState() {
  // Single source of truth for the working payload
  const currentText = useStorage<string>('global:currentText', '')

  // Snapshots of previous texts (newest first)
  const history = useStorage<Snapshot[]>('global:history', [])

  // --- One-time migration from legacy key used by older tools
  try {
    if (!currentText.value && typeof window !== 'undefined') {
      const legacy = window.localStorage.getItem('payload:text')
      if (legacy && legacy.trim().length > 0) {
        currentText.value = legacy
        // optional: keep legacy for now; remove if you want to fully migrate
        // window.localStorage.removeItem('payload:text')
      }
    }
  }
  catch {}

  function pushHistory(text: string, tool?: string, note?: string) {
    const now = Date.now()
    const snap: Snapshot = { id: now, timestamp: now, text, tool, note }
    history.value = [snap, ...(history.value ?? [])].slice(0, 100)
  }

  /**
   * Set the current text. If there's an existing value, store it in history first.
   */
  function setCurrentText(text: string, tool?: string, note?: string) {
    if (currentText.value) {
      pushHistory(currentText.value, tool, note)
    }
    currentText.value = text
  }

  function restoreSnapshot(id: number) {
    const snap = (history.value ?? []).find(s => s.id === id)
    if (snap)
      setCurrentText(snap.text, 'restore', snap.note)
  }

  function clearHistory() {
    history.value = []
  }

  return {
    currentText,
    history,
    setCurrentText,
    pushHistory,
    restoreSnapshot,
    clearHistory,
  }
}
