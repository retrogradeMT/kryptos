import { useRoute, useRouter } from '#imports'

export type UrlStateType = 'string' | 'number' | 'boolean'
export interface UrlEntry {
  key: string
  type?: UrlStateType
  default?: any
}
export type UrlSchema = Record<string, string | UrlEntry>

function coerce(val: any, type: UrlStateType | undefined) {
  if (val == null) return val
  if (!type) return val
  if (type === 'number') {
    const n = Number(val)
    return Number.isFinite(n) ? n : undefined
  }
  if (type === 'boolean') {
    if (typeof val === 'boolean') return val
    const s = String(val).toLowerCase()
    return s === '1' || s === 'true' || s === 'yes'
  }
  return String(val)
}

export const useUrlState = (schema: UrlSchema = {}) => {
  const route = useRoute()
  const router = useRouter()

  // Build normalized entries, ignoring invalid shapes to avoid runtime errors
  const entries = Object.entries(schema).flatMap(([alias, ent]) => {
    if (typeof ent === 'string') {
      return [{ alias, key: ent, type: 'string' as UrlStateType, default: undefined }]
    }
    if (ent && typeof ent === 'object' && typeof (ent as any).key === 'string') {
      const e = ent as UrlEntry
      return [{ alias, key: e.key, type: (e.type ?? 'string') as UrlStateType, default: e.default }]
    }
    if (process.dev) {
      // eslint-disable-next-line no-console
      console.warn('[useUrlState] Ignoring invalid schema entry for alias', alias, ent)
    }
    return []
  })

  function decode(query: Record<string, any>) {
    const out: Record<string, any> = {}
    for (const ent of entries) {
      const raw = (query as any)[ent.alias]
      if (raw == null) {
        if (ent.default !== undefined) out[ent.key] = ent.default
        continue
      }
      out[ent.key] = coerce(raw, ent.type)
    }
    return out
  }

  function encode(state: Record<string, any>) {
    const q: Record<string, any> = { ...route.query }
    for (const ent of entries) {
      const v = state[ent.key]
      if (v === undefined || v === null || v === '') delete q[ent.alias]
      else q[ent.alias] = String(v)
    }
    return q
  }

  async function patchQuery(state: Record<string, any>) {
    const q = encode(state)
    try { await router.replace({ query: q }) } catch (_) { /* ignore */ }
  }

  return { decode, encode, patchQuery }
}
