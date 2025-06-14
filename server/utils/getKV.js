import { useRuntimeConfig } from '#imports'

export async function getKVValue(key, context) {
  const config = useRuntimeConfig()
  const isDev = import.meta.dev
  const MY_KV = context?.cloudflare?.env?.MY_KV

  const fetchFromAPI = async () => {
    const { cfAccountId, cfKVNamespaceId, cfApiToken } = config
    const url = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/storage/kv/namespaces/${cfKVNamespaceId}/values/${key}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cfApiToken}`,
      },
    })
    if (!res.ok) {
      console.warn('❌ Remote fetch failed')
      return null
    }
    return await res.text()
  }

  // Dev only: sync from API to local KV
  if (isDev && typeof MY_KV !== 'undefined') {
    console.log('🛠 Dev mode – syncing from API to local KV')
    const remoteValue = await fetchFromAPI()
    if (remoteValue !== null) {
      try {
        await MY_KV.put(key, remoteValue)
        console.log('📥 Synced to local KV')
      }
      catch (e) {
        console.warn('⚠️ Failed to write to local KV:', e)
      }
    }
  }

  // Always try local KV first if available
  if (typeof MY_KV !== 'undefined') {
    const localValue = await MY_KV.get(key)
    if (localValue !== null) {
      console.log('✅ Retrieved from local KV')
      return localValue
    }

    if (isDev) {
      console.log('🔍 Not found in KV, trying API fallback (dev only)')
      return await fetchFromAPI()
    }
    else {
      console.warn('🚫 Not found in KV and API fallback is disabled in production')
      return null
    }
  }

  // No KV available
  if (isDev) {
    console.log('🌐 No KV available, trying API fallback (dev only)')
    return await fetchFromAPI()
  }
  else {
    console.warn('🚫 No KV and no API fallback in production')
    return null
  }
}