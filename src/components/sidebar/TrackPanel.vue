<template>
  <section class="panel">
    <label class="field">
      <span>Nom du projet</span>
      <input
        :value="projectName"
        class="text-input"
        type="text"
        placeholder="Nom du projet"
        @input="$emit('update:project-name', ($event.target as HTMLInputElement).value)"
      />
    </label>
  </section>

  <section class="panel">
    <label class="upload-btn">
      <span>Importer des GPX</span>
      <input type="file" accept=".gpx" multiple @change="$emit('gpx-files', $event)" />
    </label>
  </section>

  <section class="panel">
    <div class="panel-title-row">
      <h2>Pistes</h2>
      <div class="panel-title-actions">
        <button
          v-if="tracks.length > 0"
          type="button"
          class="title-action-button"
          title="Zoomer sur tout le projet"
          @click="$emit('fit-project')"
        >
          <Repeat2 class="title-action-icon" />
        </button>

        <span class="count-badge">{{ tracks.length }}</span>
      </div>
    </div>

    <div v-if="tracks.length === 0" class="empty-state">
      Aucune trace chargee.
    </div>

    <div v-for="track in tracks" :key="track.id" class="track-card" :class="{ expanded: isExpanded(track.id) }">
      <div class="track-header">
        <button
          type="button"
          class="expand-button"
          :class="{ open: isExpanded(track.id) }"
          :title="isExpanded(track.id) ? 'Masquer les reglages' : 'Afficher les reglages'"
          :aria-expanded="isExpanded(track.id)"
          @click="toggleExpanded(track.id)"
        >
          <component :is="isExpanded(track.id) ? ChevronUp : Pencil" class="expand-icon" />
        </button>

        <input v-model="track.label" class="text-input grow" type="text" placeholder="Libelle" />

        <button
          type="button"
          class="visibility-button"
          title="Zoomer sur cette piste"
          @click="$emit('fit-track', track.id)"
        >
          <Repeat2 class="visibility-icon" />
        </button>

        <button
          type="button"
          class="visibility-button"
          :class="{ active: track.visible }"
          :title="track.visible ? 'Masquer la trace' : 'Afficher la trace'"
          :aria-pressed="track.visible"
          @click="track.visible = !track.visible"
        >
          <component :is="track.visible ? Eye : EyeOff" class="visibility-icon" />
        </button>

        <button
          type="button"
          class="delete-button"
          title="Supprimer la piste"
          @click="removeTrack(track.id)"
        >
          <Trash2 class="delete-icon" />
        </button>
      </div>

      <div v-if="isExpanded(track.id)" class="track-settings">
        <div class="track-row">
          <label class="field">
            <span>Couleur</span>
            <div class="color-picker">
              <button
                v-for="color in predefinedColors"
                :key="color"
                type="button"
                class="color-button"
                :class="{ active: normalizeColor(track.color) === normalizeColor(color) }"
                :title="color"
                @click="track.color = color"
              >
                <span class="color-swatch" :style="{ background: color }"></span>
              </button>
            </div>
          </label>
        </div>

        <div class="track-row">
          <label class="field">
            <span>Epaisseur</span>
            <div class="width-picker">
              <button
                v-for="width in widthLevels"
                :key="width"
                type="button"
                class="width-button"
                :class="{ active: track.width === width }"
                :title="`Epaisseur ${width}`"
                @click="setTrackWidth(track, width)"
              >
                <span class="width-swatch">
                  <span
                    class="width-preview"
                    :style="{ width: `${width + 4}px`, height: `${width + 4}px` }"
                  ></span>
                </span>
              </button>
            </div>
          </label>
        </div>

        <div class="track-row">
          <label class="field grow">
            <span>Style</span>
            <div class="style-picker">
              <button
                v-for="styleOption in styleOptions"
                :key="styleOption.value"
                type="button"
                class="style-button"
                :class="{ active: track.style === styleOption.value }"
                :title="styleOption.label"
                @click="track.style = styleOption.value"
              >
                <span
                  class="style-preview"
                  :class="`style-preview-${styleOption.value}`"
                  aria-hidden="true"
                >
                  <span v-if="styleOption.value === 'solid'" class="style-line solid"></span>
                  <span v-else-if="styleOption.value === 'arrow'" class="style-line arrow">
                    <span class="arrow-line"></span>
                    <span class="arrow-head">→</span>
                  </span>
                  <span
                    v-else-if="styleOption.value === 'arrow-reverse'"
                    class="style-line arrow reverse"
                  >
                    <span class="arrow-line"></span>
                    <span class="arrow-head">←</span>
                  </span>
                  <span v-else-if="styleOption.value === 'dotted'" class="style-line dotted">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <span v-else class="style-line dashed">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </span>
              </button>
            </div>
          </label>
        </div>

        <div class="track-row">
          <label class="field">
            <span>Taille label</span>
            <div class="width-picker">
              <button
                v-for="labelSize in labelSizeLevels"
                :key="labelSize"
                type="button"
                class="width-button"
                :class="{ active: track.labelSize === labelSize }"
                :title="`Taille ${labelSize}`"
                @click="track.labelSize = labelSize"
              >
                <span class="label-size-preview" :style="{ fontSize: `${labelSize - 4}px` }">Aa</span>
              </button>
            </div>
          </label>
        </div>

        <div class="track-row">
          <label class="field grow">
            <span>Style label</span>
            <div class="style-picker">
              <button
                v-for="labelStyle in labelStyleOptions"
                :key="labelStyle.value"
                type="button"
                class="style-button"
                :class="{ active: track.labelStyle === labelStyle.value }"
                :title="labelStyle.label"
                @click="track.labelStyle = labelStyle.value"
              >
                <span
                  class="label-style-preview"
                  :class="`label-style-preview-${labelStyle.value}`"
                  :style="{ '--label-style-color': track.color }"
                  aria-hidden="true"
                >
                  <span class="label-style-text">Aa</span>
                </span>
              </button>
            </div>
          </label>
        </div>

        <div class="track-meta">
          {{ track.name || 'Sans nom' }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronUp, Eye, EyeOff, Pencil, Repeat2, Trash2 } from 'lucide-vue-next'
import type { GpxTrack, TrackLabelStyle, TrackStyle } from '../../types/gpx'

const props = defineProps<{
  tracks: GpxTrack[]
  predefinedColors: string[]
  projectName: string
}>()

const emit = defineEmits<{
  (e: 'gpx-files', event: Event): void
  (e: 'track-width-change', track: GpxTrack): void
  (e: 'remove-track', trackId: string): void
  (e: 'fit-project'): void
  (e: 'fit-track', trackId: string): void
  (e: 'update:project-name', value: string): void
}>()

const widthLevels = [2, 4, 6, 8, 10]
const labelSizeLevels = [13, 15, 17, 19]
const styleOptions: { value: TrackStyle; label: string }[] = [
  { value: 'solid', label: 'Trait plein' },
  { value: 'arrow', label: 'Trait avec fleche' },
  { value: 'arrow-reverse', label: 'Trait avec fleche inverse' },
  { value: 'dotted', label: 'Trait pointille' },
  { value: 'dashed', label: 'Trait tirets' },
]
const labelStyleOptions: { value: TrackLabelStyle; label: string }[] = [
  { value: 'classic', label: 'Classique' },
  { value: 'soft', label: 'Doux' },
  { value: 'bold', label: 'Impact' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'stamp', label: 'Stamp' },
]
const expandedTrackIds = ref<string[]>([])

watch(
  () => props.tracks.map((track) => track.id),
  (trackIds, previousTrackIds = []) => {
    const newTrackIds = trackIds.filter((id) => !previousTrackIds.includes(id))
    if (newTrackIds.length === 0) return

    expandedTrackIds.value = Array.from(new Set([...expandedTrackIds.value, ...newTrackIds]))
  },
)

function normalizeColor(color: string): string {
  return color.toLowerCase()
}

function setTrackWidth(track: GpxTrack, width: number) {
  track.width = width
  emit('track-width-change', track)
}

function isExpanded(trackId: string): boolean {
  return expandedTrackIds.value.includes(trackId)
}

function toggleExpanded(trackId: string) {
  if (isExpanded(trackId)) {
    expandedTrackIds.value = expandedTrackIds.value.filter((id) => id !== trackId)
    return
  }

  expandedTrackIds.value = [...expandedTrackIds.value, trackId]
}

function removeTrack(trackId: string) {
  expandedTrackIds.value = expandedTrackIds.value.filter((id) => id !== trackId)
  emit('remove-track', trackId)
}
</script>

<style scoped>
.panel {
  --track-control-size: 32px;
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

.panel-title-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel h2 {
  margin: 0;
  font-size: 14px;
  color: #cbd5e1;
}

.title-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #bfdbfe;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.title-action-button:hover {
  transform: translateY(-1px);
  border-color: rgba(147, 197, 253, 0.5);
  background: rgba(37, 99, 235, 0.18);
}

.title-action-icon {
  width: 14px;
  height: 14px;
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

.track-card:hover,
.track-card.expanded {
  border-color: #3b82f6;
}

.track-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.track-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 2px;
}

.track-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.grow {
  flex: 1;
  min-width: 0;
}

.text-input {
  width: 100%;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #1e293b;
  background: #0f172a;
  color: #e5e7eb;
  font: inherit;
}

.text-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.expand-button,
.visibility-button,
.delete-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  padding: 0;
  border: 1px solid #1e293b;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.96));
  color: #94a3b8;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.expand-button:hover,
.visibility-button:hover,
.delete-button:hover {
  transform: translateY(-1px);
  border-color: #475569;
  color: #e2e8f0;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.22);
}

.expand-button.open,
.visibility-button.active {
  border-color: #60a5fa;
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.24), rgba(30, 64, 175, 0.2));
  color: #eff6ff;
  box-shadow: inset 0 0 0 1px rgba(191, 219, 254, 0.15);
}

.delete-button {
  color: #fca5a5;
}

.delete-button:hover {
  border-color: rgba(248, 113, 113, 0.48);
  color: #fee2e2;
  background: linear-gradient(180deg, rgba(127, 29, 29, 0.34), rgba(69, 10, 10, 0.28));
}

.expand-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.18s ease;
}

.visibility-icon,
.delete-icon {
  width: 18px;
  height: 18px;
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

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.width-picker {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
}

.width-button,
.style-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--track-control-size);
  height: var(--track-control-size);
  flex: 0 0 var(--track-control-size);
  padding: 0;
  border: 1px solid #1e293b;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.96));
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.width-button:hover,
.style-button:hover {
  transform: translateY(-1px);
  border-color: #475569;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.22);
}

.width-button.active,
.style-button.active {
  border-color: #60a5fa;
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.24), rgba(30, 64, 175, 0.2));
  box-shadow: inset 0 0 0 1px rgba(191, 219, 254, 0.15);
}

.width-swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 6px;
}

.width-preview {
  display: inline-block;
  border-radius: 999px;
  background: #ffffff;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14),
    0 6px 14px rgba(255, 255, 255, 0.08);
}

.label-size-preview {
  color: #ffffff;
  font-weight: 800;
  line-height: 1;
}

.label-style-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.label-style-text {
  color: var(--label-style-color, #ef4444);
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
}

.label-style-preview-classic .label-style-text {
  text-shadow:
    -1.4px -1.4px 0 rgba(255, 255, 255, 0.98),
    1.4px -1.4px 0 rgba(255, 255, 255, 0.98),
    -1.4px 1.4px 0 rgba(255, 255, 255, 0.98),
    1.4px 1.4px 0 rgba(255, 255, 255, 0.98);
}

.label-style-preview-soft .label-style-text {
  text-shadow:
    -1px -1px 0 rgba(255, 255, 255, 0.72),
    1px -1px 0 rgba(255, 255, 255, 0.72),
    -1px 1px 0 rgba(255, 255, 255, 0.72),
    1px 1px 0 rgba(255, 255, 255, 0.72);
  opacity: 0.95;
}

.label-style-preview-bold .label-style-text {
  text-shadow:
    -2px -2px 0 rgba(255, 255, 255, 1),
    2px -2px 0 rgba(255, 255, 255, 1),
    -2px 2px 0 rgba(255, 255, 255, 1),
    2px 2px 0 rgba(255, 255, 255, 1);
  letter-spacing: 0.02em;
}

.label-style-preview-ghost .label-style-text {
  color: rgba(255, 255, 255, 0.96);
  text-shadow:
    -1.2px -1.2px 0 rgba(15, 23, 42, 0.74),
    1.2px -1.2px 0 rgba(15, 23, 42, 0.74),
    -1.2px 1.2px 0 rgba(15, 23, 42, 0.74),
    1.2px 1.2px 0 rgba(15, 23, 42, 0.74);
}

.label-style-preview-stamp .label-style-text {
  color: #ffffff;
  text-shadow:
    -1.2px -1.2px 0 color-mix(in srgb, var(--label-style-color, #ef4444) 82%, black),
    1.2px -1.2px 0 color-mix(in srgb, var(--label-style-color, #ef4444) 82%, black),
    -1.2px 1.2px 0 color-mix(in srgb, var(--label-style-color, #ef4444) 82%, black),
    1.2px 1.2px 0 color-mix(in srgb, var(--label-style-color, #ef4444) 82%, black);
}

.style-picker {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
}

.style-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 6px;
}

.style-line {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.style-line.solid {
  height: 2px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14),
    0 6px 14px rgba(255, 255, 255, 0.08);
}

.style-line.arrow {
  gap: 3px;
}

.style-line.arrow.reverse {
  flex-direction: row-reverse;
}

.arrow-line {
  flex: 1;
  height: 2px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.arrow-head {
  color: #ffffff;
  font-size: 10px;
  line-height: 1;
}

.style-line.dotted,
.style-line.dashed {
  gap: 4px;
}

.style-line.dotted span {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.style-line.dashed span {
  width: 6px;
  height: 2px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.2),
    0 6px 14px rgba(0, 0, 0, 0.18);
}

.color-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.color-button:hover {
  transform: scale(1.08);
}

.color-button.active .color-swatch {
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.65),
    0 0 0 3px rgba(96, 165, 250, 0.28),
    0 6px 14px rgba(0, 0, 0, 0.18);
}

.track-meta {
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 960px) {
  .track-header {
    align-items: center;
  }
}
</style>
