<template>
  <div class="embed-root">
    <div v-if="loading" class="embed-loading">
      <div class="embed-spinner" />
    </div>

    <div v-else-if="error" class="embed-error">
      <span>Poster introuvable</span>
    </div>

    <template v-else>
      <img :src="posterUrl" alt="Bikepark poster" class="embed-img" />
      <a :href="publicUrl" target="_blank" rel="noopener" class="embed-badge" title="Voir en plein écran">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        pista.bike
      </a>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = defineProps<{ projectId: string }>()

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const BUCKET = 'illustrator-posters'

const loading = ref(true)
const error = ref(false)
const posterUrl = ref('')

const publicUrl = computed(() =>
  `${window.location.origin}/poster/${props.projectId}`
)

onMounted(async () => {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${props.projectId}.png`
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) throw new Error()
    posterUrl.value = url
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.embed-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: #1a1410;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.embed-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.embed-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.embed-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(220, 180, 105, 0.2);
  border-top-color: #dcb469;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.embed-error {
  color: #9a8e78;
  font-family: system-ui, sans-serif;
  font-size: 13px;
}

.embed-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  background: rgba(42, 32, 19, 0.85);
  border: 1px solid rgba(220, 180, 105, 0.3);
  border-radius: 20px;
  color: #dcb469;
  text-decoration: none;
  font-family: system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(4px);
  transition: background 0.15s;
}

.embed-badge:hover {
  background: rgba(42, 32, 19, 0.95);
}

.embed-badge svg {
  flex-shrink: 0;
}
</style>
