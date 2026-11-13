<template>
  <div class="qr-backdrop" @click.self="$emit('close')">
    <div class="qr-modal">
      <button class="close-btn" @click="$emit('close')" aria-label="Fermer">✕</button>

      <h2 class="qr-title">🌐 Poster publié !</h2>
      <p class="qr-desc">Scannez ce QR code depuis un panneau au départ, ou partagez le lien.</p>

      <canvas ref="qrCanvas" class="qr-canvas" />

      <div class="link-row">
        <input ref="linkInput" :value="url" readonly class="link-input" @focus="selectAll" />
        <button type="button" class="copy-btn" @click="copyLink">
          {{ copied ? '✓ Copié' : '📋 Copier' }}
        </button>
      </div>

      <a :href="url" target="_blank" class="open-link">Ouvrir le poster ↗</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{ url: string }>()
defineEmits<{ (e: 'close'): void }>()

const qrCanvas = ref<HTMLCanvasElement | null>(null)
const linkInput = ref<HTMLInputElement | null>(null)
const copied = ref(false)

onMounted(async () => {
  if (qrCanvas.value) {
    await QRCode.toCanvas(qrCanvas.value, props.url, {
      width: 200,
      margin: 2,
      color: { dark: '#2a2013', light: '#efe4cc' },
    })
  }
})

function selectAll() {
  linkInput.value?.select()
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    linkInput.value?.select()
    document.execCommand('copy')
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.qr-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  backdrop-filter: blur(4px);
}

.qr-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 28px 24px;
  background: #2d2820;
  border: 1px solid rgba(220, 180, 105, 0.35);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  max-width: 320px;
  width: 90%;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  color: #9a8e78;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
}

.close-btn:hover {
  color: #ece2cf;
  background: rgba(255,255,255,0.08);
}

.qr-title {
  margin: 0;
  font-size: 17px;
  color: #f0cd8a;
  font-family: var(--font-display);
  font-weight: 800;
}

.qr-desc {
  margin: 0;
  font-size: 12.5px;
  color: #b3a890;
  text-align: center;
  line-height: 1.5;
  font-family: var(--font-display);
}

.qr-canvas {
  border-radius: 10px;
  display: block;
}

.link-row {
  display: flex;
  gap: 6px;
  width: 100%;
}

.link-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255,255,255,0.05);
  color: #ece2cf;
  font: inherit;
  font-size: 11px;
  font-family: monospace;
  outline: none;
}

.copy-btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(220, 180, 105, 0.4);
  background: rgba(220, 180, 105, 0.15);
  color: #f0cd8a;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.copy-btn:hover {
  background: rgba(220, 180, 105, 0.28);
}

.open-link {
  font-size: 12px;
  color: #dcb469;
  text-decoration: none;
  font-family: var(--font-display);
}

.open-link:hover {
  text-decoration: underline;
}
</style>
