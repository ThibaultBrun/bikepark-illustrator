<template>
  <div class="submit-overlay" @click.self="$emit('close')">
    <div class="submit-dialog">
      <header class="submit-header">
        <h2>Soumettre à Pista</h2>
        <button type="button" class="x" aria-label="Fermer" @click="$emit('close')">✕</button>
      </header>

      <p class="submit-intro">
        Ton spot et tes pistes seront enregistrés sur Pista <strong>en privé</strong> : visibles
        seulement par toi (et les admins). Tu pourras ensuite <strong>demander leur publication</strong>.
        Le style visuel reste côté illustrator ; Pista applique son propre rendu.
      </p>

      <div class="grid">
        <label class="field">
          <span>Nom du spot</span>
          <input v-model="name" type="text" placeholder="Mon bikepark" />
        </label>
        <label class="field">
          <span>Région</span>
          <input v-model="region" type="text" placeholder="Nouvelle-Aquitaine" />
        </label>
        <label class="field">
          <span>Type de spot</span>
          <select v-model="spotType">
            <option v-for="o in SPOT_TYPES" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
      </div>

      <div class="trails">
        <div class="trails-title">Pistes ({{ rows.length }})</div>
        <p v-if="rows.length === 0" class="empty">Aucune piste avec un tracé à soumettre.</p>
        <div v-for="row in rows" :key="row.id" class="trail-row">
          <span class="trail-name" :title="row.name">{{ row.name }}</span>
          <select v-model="row.trail_type" class="sel">
            <option v-for="o in TRAIL_TYPES" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <select v-model="row.difficulty" class="sel" :class="`diff-${row.difficulty}`">
            <option v-for="o in DIFFICULTIES" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <footer class="submit-footer">
        <button type="button" class="ghost" :disabled="busy" @click="$emit('close')">Annuler</button>
        <button type="button" class="primary" :disabled="busy || !canSubmit" @click="onSubmit">
          {{ busy ? 'Envoi…' : 'Soumettre' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GpxTrack } from '../types/gpx'
import type { SubmitTrail } from '../lib/projectsStore'

const props = defineProps<{
  tracks: GpxTrack[]
  defaultName: string
  busy: boolean
  error?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { name: string; region: string; spotType: string; trails: SubmitTrail[] }): void
}>()

const SPOT_TYPES = [
  { value: 'bikepark', label: 'Bikepark' },
  { value: 'zone_enduro', label: 'Zone enduro' },
  { value: 'secteur', label: 'Secteur' },
  { value: 'skills_park', label: 'Skills park' },
]
const TRAIL_TYPES = [
  { value: 'enduro', label: 'Enduro' },
  { value: 'dh', label: 'Descente (DH)' },
  { value: 'uplift_lift', label: 'Remontée (télésiège)' },
  { value: 'uplift_bike', label: 'Navette' },
]
const DIFFICULTIES = [
  { value: 'green', label: 'Vert' },
  { value: 'blue', label: 'Bleu' },
  { value: 'red', label: 'Rouge' },
  { value: 'black', label: 'Noir' },
]

function trackGeometry(track: GpxTrack): GeoJSON.MultiLineString | null {
  const lines: number[][][] = []
  for (const f of track.geojson?.features ?? []) {
    const g = f.geometry
    if (!g) continue
    if (g.type === 'LineString') lines.push(g.coordinates as number[][])
    else if (g.type === 'MultiLineString') for (const l of g.coordinates) lines.push(l as number[][])
  }
  if (!lines.length) return null
  return { type: 'MultiLineString', coordinates: lines }
}

type Row = { id: string; name: string; trail_type: string; difficulty: string; geometry: GeoJSON.MultiLineString }

const rows = ref<Row[]>(
  props.tracks
    .map((t) => {
      const geometry = trackGeometry(t)
      if (!geometry) return null
      return {
        id: t.id,
        name: t.label?.trim() || t.name?.trim() || 'Piste',
        trail_type: 'enduro',
        difficulty: 'blue',
        geometry,
      } as Row
    })
    .filter((r): r is Row => r !== null),
)

const name = ref(props.defaultName?.trim() || 'Mon bikepark')
const region = ref('')
const spotType = ref('bikepark')

const canSubmit = computed(
  () => name.value.trim().length > 0 && region.value.trim().length > 0 && rows.value.length > 0,
)

function onSubmit() {
  if (!canSubmit.value) return
  emit('submit', {
    name: name.value.trim(),
    region: region.value.trim(),
    spotType: spotType.value,
    trails: rows.value.map((r) => ({
      name: r.name,
      trail_type: r.trail_type,
      difficulty: r.difficulty,
      geometry: r.geometry,
    })),
  })
}
</script>

<style scoped>
.submit-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(4px);
}

.submit-dialog {
  width: 100%;
  max-width: 520px;
  max-height: 88vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: 16px;
  background: #2a251e;
  border: 1px solid #38322a;
  box-shadow: 0 30px 60px rgba(2, 6, 23, 0.6);
}

.submit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.submit-header h2 {
  margin: 0;
  font-size: 16px;
  color: #ece2cf;
}

.x {
  border: none;
  background: none;
  color: #b3a890;
  font-size: 16px;
  cursor: pointer;
}

.submit-intro {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: #b3a890;
}

.grid {
  display: grid;
  gap: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: #b3a890;
}

.field input,
.sel,
.field select {
  min-height: 40px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid #4a4234;
  background: #1c1813;
  color: #ece2cf;
  font: inherit;
  font-size: 13px;
}

.field input:focus,
.sel:focus {
  outline: none;
  border-color: #dcb469;
}

.trails {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trails-title {
  font-size: 13px;
  font-weight: 700;
  color: #d8ccb6;
}

.empty {
  margin: 0;
  font-size: 12.5px;
  color: #f59e0b;
}

.trail-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1.1fr 0.9fr;
  gap: 8px;
  align-items: center;
}

.trail-name {
  font-size: 13px;
  color: #ece2cf;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sel.diff-green { color: #86efac; }
.sel.diff-blue { color: #e7c98a; }
.sel.diff-red { color: #fca5a5; }
.sel.diff-black { color: #d8ccb6; }

.error {
  margin: 0;
  font-size: 13px;
  color: #fca5a5;
}

.submit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.ghost,
.primary {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 11px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.ghost {
  border: 1px solid #4a4234;
  background: transparent;
  color: #ece2cf;
}

.primary {
  border: 1px solid rgba(220, 180, 105, 0.5);
  background: linear-gradient(135deg, #cda35a, #dcb469);
  color: #f7ecd4;
}

.primary:disabled,
.ghost:disabled {
  opacity: 0.55;
  cursor: default;
}
</style>
