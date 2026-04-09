<template>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>Bikepark Illustrator</h1>
        <p class="subtitle">Subtitle</p>
      </div>

      <section class="panel">
        <label class="upload-btn">
          <span>Importer des GPX</span>
          <input type="file" accept=".gpx" multiple @change="onGpxFiles" />
        </label>
      </section>

      <section class="panel">
        <div class="panel-title-row">
          <h2>Traces</h2>
          <span class="count-badge">{{ tracks.length }}</span>
        </div>

        <div v-if="tracks.length === 0" class="empty-state">
          Aucune trace chargée.
        </div>

        <div v-for="track in tracks" :key="track.id" class="track-card">
          <div class="track-header">
            <div class="color-dot" :style="{ background: track.color }"></div>
            <input v-model="track.label" class="text-input grow" type="text" placeholder="Libellé" />
            <label class="checkbox">
              <input v-model="track.visible" type="checkbox" />
              <span>Visible</span>
            </label>
          </div>

          <div class="track-row two-cols">
            <label class="field">
              <span>Couleur</span>
              <input v-model="track.color" type="color" class="color-input" />
            </label>

            <label class="field">
              <span>Épaisseur</span>
              <input v-model.number="track.width" type="range" min="1" max="12" step="1" />
            </label>
          </div>

          <div class="track-row">
            <label class="field grow">
              <span>Style</span>
              <select v-model="track.style" class="select-input">
                <option value="solid">Plein</option>
                <option value="dashed">Pointillé</option>
                <option value="dotted">Points</option>
              </select>
            </label>
          </div>

          <div class="track-meta">
            {{ track.name || 'Sans nom' }}
          </div>
        </div>
      </section>
    </aside>

    <main class="map-wrapper">
      <MapView :tracks="tracks" @update-label-position="onUpdateLabelPosition" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { gpx } from '@mapbox/togeojson'
import MapView from './components/MapView.vue'
import type { GpxTrack } from './types/gpx'

const tracks = ref<GpxTrack[]>([])

function uid() {
  return Math.random().toString(36).slice(2, 10)
}
function onUpdateLabelPosition(payload: {
  trackId: string
  position: [number, number]
}) {
  const track = tracks.value.find((t) => t.id === payload.trackId)
  if (!track) return

  track.labelPosition = payload.position
}
async function onGpxFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return

  for (const file of Array.from(files)) {
    const text = await file.text()
    const xml = new DOMParser().parseFromString(text, 'application/xml')
    const geojson = gpx(xml) as GeoJSON.FeatureCollection

    const baseName = file.name.replace(/\.gpx$/i, '')

    tracks.value.push({
      id: uid(),
      name: baseName,
      color: '#ff2d55',
      width: 4,
      style: 'solid',
      label: baseName,
      visible: true,
      geojson,
    })
  }

  input.value = ''
}
</script>

<style scoped>
.sidebar {
  padding: 18px;
  background: #0f172a;
  color: #e5e7eb;
  overflow-y: auto;
}

.sidebar-header {
  margin-bottom: 18px;
}

.sidebar h1 {
  margin: 0 0 4px;
  font-size: 20px;
  line-height: 1.1;
}

.subtitle {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.panel {
  margin-bottom: 16px;
  padding: 14px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel h2 {
  margin: 0;
  font-size: 14px;
  color: #cbd5e1;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #1e293b;
  color: #93c5fd;
  font-size: 12px;
  font-weight: 700;
}

.upload-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
}

.upload-btn input {
  display: none;
}

.empty-state {
  color: #94a3b8;
  font-size: 13px;
}

.track-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 14px;
  margin-bottom: 10px;
  transition: border-color 0.15s ease;
}

.track-card:hover {
  border-color: #3b82f6;
}

.track-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.track-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.two-cols>* {
  flex: 1;
}

.grow {
  flex: 1;
  min-width: 0;
}

.text-input,
.select-input {
  width: 100%;
  min-width: 0;
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid #1e293b;
  background: #0f172a;
  color: #e5e7eb;
  font: inherit;
}

.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field span {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

.color-input {
  width: 100%;
  height: 34px;
  padding: 0;
  border: 1px solid #1e293b;
  border-radius: 10px;
  background: #0f172a;
  cursor: pointer;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.track-meta {
  font-size: 12px;
  color: #94a3b8;
}
</style>