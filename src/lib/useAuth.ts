import { ref } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

// État partagé (singleton) entre tous les appels useAuth().
const session = ref<Session | null>(null)
const user = ref<User | null>(null)
const ready = ref(false)
let initialized = false

function init() {
  if (initialized) return
  initialized = true

  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
    user.value = data.session?.user ?? null
    ready.value = true
  })

  supabase.auth.onAuthStateChange((_event, s) => {
    session.value = s
    user.value = s?.user ?? null
    ready.value = true
  })
}

export function useAuth() {
  init()

  return {
    session,
    user,
    ready,
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
