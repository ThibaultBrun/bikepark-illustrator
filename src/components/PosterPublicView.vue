<template>
  <div class="poster-public">
    <div v-if="loading" class="state-overlay">
      <div class="spinner" />
      <p>Chargement…</p>
    </div>

    <div v-else-if="error" class="state-overlay error">
      <p>{{ error }}</p>
      <a href="/" class="back-link">← Retour à l'éditeur</a>
    </div>

    <template v-else>
      <!-- Full-screen poster image -->
      <img
        :src="posterUrl"
        alt="Poster bikepark"
        class="poster-img"
        @load="onImageLoaded"
      />

      <!-- Overlay UI: download + QR -->
      <div class="overlay-ui">
        <div class="ui-card">
          <canvas ref="qrCanvas" class="qr-canvas" />
          <p class="qr-hint">Scannez pour accéder au plan</p>

          <a
            :href="posterUrl"
            :download="`poster.png`"
            class="dl-btn"
            target="_blank"
          >
            ⬇ Télécharger
          </a>

          <a href="/" class="back-link">← Éditeur</a>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{ projectId: string }>()

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const BUCKET = 'illustrator-posters'

const loading = ref(true)
const error = ref<string | null>(null)
const posterUrl = ref('')
const qrCanvas = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${props.projectId}.png`
  // Check if the image exists by probing it
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) throw new Error("Poster introuvable (vérifiez que le poster a bien été publié depuis l'éditeur).")
    posterUrl.value = url
    loading.value = false
    // Render QR code after next tick (canvas must be in DOM)
    requestAnimationFrame(() => renderQR())
  } catch (e: any) {
    error.value = e.message ?? 'Erreur lors du chargement du poster.'
    loading.value = false
  }
})

function onImageLoaded() {
  renderQR()
}

async function renderQR() {
  const canvas = qrCanvas.value
  if (!canvas) return
  const link = window.location.href
  await QRCode.toCanvas(canvas, link, {
    width: 128,
    margin: 1,
    color: { dark: '#2a2013', light: '#efe4cc' },
  })
}
</script>

<style scoped>
.poster-public {
  position: fixed;
  inset: 0;
  background: #1a1410;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.poster-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.state-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #b3a890;
  font-family: var(--font-display);
  font-size: 15px;
}

.state-overlay.error {
  color: #d47a7a;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(220, 180, 105, 0.2);
  border-top-color: #dcb469;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.overlay-ui {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10;
}

.ui-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px;
  background: rgba(42, 32, 19, 0.92);
  border: 1px solid rgba(220, 180, 105, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.qr-canvas {
  border-radius: 8px;
  display: block;
}

.qr-hint {
  margin: 0;
  font-size: 11px;
  color: #9a8e78;
  font-family: var(--font-display);
  text-align: center;
  max-width: 128px;
}

.dl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.95), rgba(220, 180, 105, 0.95));
  color: #2a2013;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.15s;
  width: 100%;
  text-align: center;
}

.dl-btn:hover {
  transform: translateY(-1px);
}

.back-link {
  font-size: 11px;
  color: #9a8e78;
  text-decoration: none;
  font-family: var(--font-display);
}

.back-link:hover {
  color: #dcb469;
}
</style>
