<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-brand">
        <img src="/favicon.svg" alt="" width="44" height="44" />
        <div>
          <h1>Bikepark Illustrator</h1>
          <p>Connecte-toi avec ton compte Pista pour créer et soumettre tes spots.</p>
        </div>
      </div>

      <button type="button" class="google-btn" :disabled="busy" @click="onGoogle">
        <span class="google-g">G</span>
        Continuer avec Google
      </button>

      <div class="sep"><span>ou</span></div>

      <form class="login-form" @submit.prevent="onSubmit">
        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required placeholder="toi@exemple.fr" />
        </label>
        <label class="field">
          <span>Mot de passe</span>
          <input v-model="password" type="password" autocomplete="current-password" required minlength="6" placeholder="••••••••" />
        </label>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="info" class="info">{{ info }}</p>

        <button type="submit" class="primary-btn" :disabled="busy">
          {{ mode === 'signin' ? 'Se connecter' : 'Créer un compte' }}
        </button>
      </form>

      <button type="button" class="toggle" @click="toggleMode">
        {{ mode === 'signin' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../lib/useAuth'

const { signInWithPassword, signUp, signInWithGoogle } = useAuth()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const error = ref('')
const info = ref('')
const busy = ref(false)

function toggleMode() {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin'
  error.value = ''
  info.value = ''
}

async function onSubmit() {
  error.value = ''
  info.value = ''
  busy.value = true
  try {
    if (mode.value === 'signin') {
      const { error: e } = await signInWithPassword(email.value, password.value)
      if (e) error.value = traduire(e.message)
    } else {
      const { error: e } = await signUp(email.value, password.value)
      if (e) error.value = traduire(e.message)
      else info.value = 'Compte créé. Vérifie tes mails si une confirmation est demandée.'
    }
  } finally {
    busy.value = false
  }
}

async function onGoogle() {
  error.value = ''
  busy.value = true
  try {
    const { error: e } = await signInWithGoogle()
    if (e) error.value = traduire(e.message)
  } finally {
    busy.value = false
  }
}

function traduire(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'Email ou mot de passe incorrect.'
  if (/already registered/i.test(msg)) return 'Cet email a déjà un compte.'
  return msg
}
</script>

<style scoped>
.login-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(1200px 600px at 50% -10%, #3a2f1c 0%, #1c1813 60%);
}

.login-card {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 18px;
  background: #2a251e;
  border: 1px solid #38322a;
  box-shadow: 0 30px 60px rgba(2, 6, 23, 0.6);
}

.login-brand {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.login-brand h1 {
  margin: 0;
  font-size: 17px;
  color: #ece2cf;
}

.login-brand p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #b3a890;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid #4a4234;
  background: #f7f2e7;
  color: #25211a;
  font: inherit;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.google-g {
  font-weight: 900;
  color: #4285f4;
}

.sep {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}

.sep::before,
.sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #38322a;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #b3a890;
}

.field input {
  min-height: 42px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #4a4234;
  background: #1c1813;
  color: #ece2cf;
  font: inherit;
  font-size: 14px;
}

.field input:focus {
  outline: none;
  border-color: #dcb469;
}

.primary-btn {
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(220, 180, 105, 0.5);
  background: linear-gradient(135deg, #cda35a, #dcb469);
  color: #f7ecd4;
  font: inherit;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.toggle {
  background: none;
  border: none;
  color: #e7c98a;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.error {
  margin: 0;
  font-size: 13px;
  color: #fca5a5;
}

.info {
  margin: 0;
  font-size: 13px;
  color: #86efac;
}
</style>
