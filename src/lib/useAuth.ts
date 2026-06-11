import { ref } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

// État partagé (singleton) entre tous les appels useAuth().
const session = ref<Session | null>(null)
const user = ref<User | null>(null)
const ready = ref(false)
const isAdmin = ref(false)
let initialized = false

async function refreshAdmin() {
  const uid = user.value?.id
  if (!uid) {
    isAdmin.value = false
    return
  }
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', uid).maybeSingle()
  isAdmin.value = !!(data as { is_admin?: boolean } | null)?.is_admin
}

function init() {
  if (initialized) return
  initialized = true

  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
    user.value = data.session?.user ?? null
    ready.value = true
    void refreshAdmin()
  })

  supabase.auth.onAuthStateChange((_event, s) => {
    session.value = s
    user.value = s?.user ?? null
    ready.value = true
    void refreshAdmin()
  })
}

export function useAuth() {
  init()

  return {
    session,
    user,
    ready,
    isAdmin,
    signInWithPassword: (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string) =>
      supabase.auth.signUp({ email, password }),
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      }),
    signOut: () => supabase.auth.signOut(),
  }
}
