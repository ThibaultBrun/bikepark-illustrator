import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  console.error('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants (.env)')
}

/**
 * Verrou d'auth résilient (repris de Pista) : supabase-js sérialise le refresh
 * du token via l'API Web Locks. Sur certaines webviews mobiles le verrou peut
 * rester bloqué et casser l'app — ici on exécute quand même si on ne l'obtient pas.
 */
async function resilientLock<R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const locks = (globalThis as { navigator?: { locks?: { request?: unknown } } })?.navigator?.locks as
    | { request: (n: string, o: object, cb: () => Promise<R>) => Promise<R> }
    | undefined
  if (!locks?.request) return fn()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), acquireTimeout > 0 ? acquireTimeout : 5000)
  try {
    return await locks.request(name, { mode: 'exclusive', signal: controller.signal }, async () => fn())
  } catch {
    return fn()
  } finally {
    clearTimeout(timer)
  }
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: resilientLock,
  },
})
