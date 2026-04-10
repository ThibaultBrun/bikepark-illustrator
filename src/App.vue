<template>
  <div class="app" :class="{ 'sidebar-open': isSidebarOpen }">
    <SidebarPanel
      :is-open="isSidebarOpen"
      :active-section="activeSection"
      :sections="sidebarSections"
      :tracks="tracks"
      :symbols="symbols"
      :custom-symbols="customSymbols"
      :selected-symbol-id="selectedSymbolId"
      :predefined-colors="predefinedColors"
      :map-settings="mapSettings"
      @toggle="toggleSidebar"
      @close="closeSidebar"
      @open-section="openSection"
      @gpx-files="onGpxFiles"
      @remove-track="onRemoveTrack"
      @start-symbol-drag="onStartSymbolDrag"
      @upload-svg="onUploadSvg"
      @update-symbol-size="onUpdateSymbolSize"
      @update-symbol-transform="onUpdateSymbolTransform"
      @track-width-change="onWidthChange"
      @update:map-settings="mapSettings = $event"
    />

    <main class="map-wrapper">
      <MapView
        :tracks="tracks"
        :symbols="symbols"
        :custom-symbols="customSymbols"
        :dragging-symbol-type="draggingSymbolId"
        :drag-pointer="dragPointer"
        :terrain-exaggeration="mapSettings.terrain"
        :hillshade-strength="mapSettings.hillshade"
        :label-font="mapSettings.labelFont"
        @add-symbol="onAddSymbol"
        @complete-symbol-drag="onCompleteSymbolDrag"
        @remove-symbol="onRemoveSymbol"
        @select-symbol="onSelectSymbol"
        @update-symbol-size="onUpdateSymbolSize"
        @update-symbol-position="onUpdateSymbolPosition"
        @update-label-position="onUpdateLabelPosition"
      />

      <div v-if="showWelcomeCard" class="app-empty-state">
        <div class="app-empty-state__card">
          <div class="app-empty-state__eyebrow">pista.bike</div>
          <h1>Bikepark Illustrator</h1>
          <p>
            Importe une trace GPX, ajoute des symboles et compose ton plan de bikepark
            directement sur la carte.
          </p>

          <button type="button" class="app-empty-state__cta" @click="startProject">
            Commencer
          </button>
        </div>
      </div>

    </main>

    <div class="app-floating-brand">
      <span class="app-floating-brand__name">Bikepark Illustrator</span>
    </div>

    <div
      v-if="draggingSymbolId && dragPreview"
      class="symbol-drag-preview"
      :style="{
        left: `${dragPointer.x}px`,
        top: `${dragPointer.y}px`,
        '--preview-color': dragPreview.color,
      }"
    >
      <span
        class="symbol-drag-preview__core"
        v-html="draggingSymbolId ? getSymbolSvg(draggingSymbolId, customSymbols) : ''"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { gpx } from '@mapbox/togeojson'
import MapView from './components/MapView.vue'
import type { MapSettings } from './components/sidebar/map-settings'
import SidebarPanel from './components/sidebar/SidebarPanel.vue'
import type { SidebarSection, SidebarSectionId } from './components/sidebar/types'
import type { GpxTrack } from './types/gpx'
import {
  buildCustomSymbolDefinition,
  getSymbolDefinition,
  getSymbolSvg,
  type MapSymbol,
  type SymbolDefinition,
  type SymbolId,
  type UploadedSymbolPayload,
} from './types/symbol'

const predefinedColors = [
  '#22c55e',
  '#3b82f6',
  '#ef4444',
  '#000000',
  '#6b7280',
  '#ffffff',
  '#fbbf24',
  '#92400e',
]

const sidebarSections: SidebarSection[] = [
  {
    id: 'track',
    icon: 'T',
    title: 'Pistes',
    description: 'Importer et styliser les traces GPX.',
    placeholder: '',
  },
  {
    id: 'symbol',
    icon: 'S',
    title: 'Symboles',
    description: 'Preparer les icones et marqueurs.',
    placeholder: 'Section reservee aux symboles et reperes a venir.',
  },
  {
    id: 'map',
    icon: 'M',
    title: 'Carte',
    description: 'Regler le fond de carte et les options visuelles.',
    placeholder: 'Section reservee aux reglages de carte, relief et ombrage.',
  },
  {
    id: 'export',
    icon: 'E',
    title: 'Export',
    description: 'Preparer les sorties et exports finaux.',
    placeholder: 'Section reservee aux options d export et de rendu final.',
  },
]

const tracks = ref<GpxTrack[]>([])
const symbols = ref<MapSymbol[]>([])
const customSymbols = ref<SymbolDefinition[]>([])
const draggingSymbolId = ref<SymbolId | null>(null)
const selectedSymbolId = ref<string | null>(null)
const dragPointer = ref({ x: 0, y: 0 })
const isSidebarOpen = ref(false)
const hasStartedWelcome = ref(false)
const activeSection = ref<SidebarSectionId>('track')
const mapSettings = ref<MapSettings>({
  terrain: 1.4,
  hillshade: 100,
  labelFont: 'segoe',
})
let stopSymbolDragListeners: (() => void) | null = null

const dragPreview = computed(() => {
  if (!draggingSymbolId.value) return null
  return getSymbolDefinition(draggingSymbolId.value, customSymbols.value)
})

const isProjectEmpty = computed(() => {
  return tracks.value.length === 0 && symbols.value.length === 0
})

const showWelcomeCard = computed(() => {
  return isProjectEmpty.value && !hasStartedWelcome.value
})

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function closeSidebar() {
  isSidebarOpen.value = false
}

function openSection(sectionId: SidebarSectionId) {
  activeSection.value = sectionId
  isSidebarOpen.value = true
}

function startProject() {
  hasStartedWelcome.value = true
  activeSection.value = 'track'
  isSidebarOpen.value = true
}

function onWidthChange(_track: GpxTrack) {
  // La reactivite naturelle de Vue devrait suffire.
}

function onRemoveTrack(trackId: string) {
  tracks.value = tracks.value.filter((track) => track.id !== trackId)
}

function onUpdateLabelPosition(payload: {
  trackId: string
  position: [number, number]
}) {
  const track = tracks.value.find((t) => t.id === payload.trackId)
  if (!track) return

  track.labelPosition = payload.position
}

function onAddSymbol(payload: {
  symbolId: SymbolId
  position: [number, number]
}) {
  const newSymbol = {
    id: uid(),
    symbolId: payload.symbolId,
    lngLat: payload.position,
    iconSize: 17,
    rotation: 0,
    flipX: false,
    flipY: false,
  }

  symbols.value.push(newSymbol)
  selectedSymbolId.value = newSymbol.id
}

function onUpdateSymbolPosition(payload: {
  symbolId: string
  position: [number, number]
}) {
  const symbol = symbols.value.find((item) => item.id === payload.symbolId)
  if (!symbol) return

  symbol.lngLat = payload.position
}

function onRemoveSymbol(payload: { symbolId: string }) {
  symbols.value = symbols.value.filter((item) => item.id !== payload.symbolId)
  if (selectedSymbolId.value === payload.symbolId) {
    selectedSymbolId.value = null
  }
}

function onSelectSymbol(payload: { symbolId: string | null }) {
  selectedSymbolId.value = payload.symbolId

  if (payload.symbolId && isMobileViewport()) {
    activeSection.value = 'symbol'
    isSidebarOpen.value = true
  }
}

function onUpdateSymbolSize(payload: { symbolId: string; iconSize: number }) {
  const symbol = symbols.value.find((item) => item.id === payload.symbolId)
  if (!symbol) return

  symbol.iconSize = payload.iconSize
  selectedSymbolId.value = payload.symbolId
}

function onUpdateSymbolTransform(payload: {
  symbolId: string
  rotation?: number
  flipX?: boolean
  flipY?: boolean
}) {
  const symbol = symbols.value.find((item) => item.id === payload.symbolId)
  if (!symbol) return

  if (payload.rotation !== undefined) {
    symbol.rotation = payload.rotation
  }

  if (payload.flipX !== undefined) {
    symbol.flipX = payload.flipX
  }

  if (payload.flipY !== undefined) {
    symbol.flipY = payload.flipY
  }

  selectedSymbolId.value = payload.symbolId
}

function clearSymbolDrag() {
  draggingSymbolId.value = null
  stopSymbolDragListeners?.()
  stopSymbolDragListeners = null
}

function onCompleteSymbolDrag() {
  clearSymbolDrag()
}

function onStartSymbolDrag(payload: {
  symbolId: SymbolId
  clientX: number
  clientY: number
}) {
  clearSymbolDrag()

  if (isMobileViewport()) {
    isSidebarOpen.value = false
  }

  draggingSymbolId.value = payload.symbolId
  dragPointer.value = { x: payload.clientX, y: payload.clientY }

  const handlePointerMove = (event: PointerEvent) => {
    dragPointer.value = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = () => {
    window.setTimeout(() => {
      clearSymbolDrag()
    }, 0)
  }

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp, { once: true })

  stopSymbolDragListeners = () => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }
}

function onUploadSvg(payload: UploadedSymbolPayload) {
  const symbolId = `custom-${uid()}`
  customSymbols.value = [...customSymbols.value, buildCustomSymbolDefinition(symbolId, payload)]
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
      color: predefinedColors[tracks.value.length % predefinedColors.length],
      width: 4,
      style: 'solid',
      label: baseName,
      visible: true,
      labelSize: 16,
      labelStyle: 'classic',
      geojson,
    })
  }

  input.value = ''
}
</script>

<style scoped>
.app {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  height: 100%;
  background: #020617;
}

.map-wrapper {
  position: relative;
  z-index: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
}

.app-empty-state {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  pointer-events: none;
}

.app-empty-state__card {
  max-width: 440px;
  padding: 26px 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.68)),
    radial-gradient(circle at top, rgba(96, 165, 250, 0.12), transparent 58%);
  color: #f8fafc;
  text-align: center;
  box-shadow:
    0 24px 60px rgba(2, 6, 23, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
  pointer-events: auto;
}

.app-empty-state__eyebrow {
  margin-bottom: 10px;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.app-empty-state h1 {
  margin: 0 0 10px;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 0.95;
  letter-spacing: -0.04em;
}

.app-empty-state p {
  margin: 0;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.6;
}

.app-empty-state__cta {
  margin-top: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 138px;
  padding: 12px 18px;
  border: 1px solid rgba(96, 165, 250, 0.42);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.88), rgba(59, 130, 246, 0.88));
  color: #eff6ff;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow:
    0 16px 34px rgba(30, 64, 175, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    filter 0.16s ease;
}

.app-empty-state__cta:hover {
  transform: translateY(-1px);
  box-shadow:
    0 18px 38px rgba(30, 64, 175, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  filter: brightness(1.04);
}

.app-floating-brand {
  position: absolute;
  top: 16px;
  left: 50%;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7px 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.18);
  color: #f8fafc;
  transform: translateX(-50%);
  box-shadow: 0 8px 22px rgba(2, 6, 23, 0.1);
  backdrop-filter: blur(6px);
  pointer-events: none;
}

.app-floating-brand__name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgba(248, 250, 252, 0.96);
}

.symbol-drag-preview {
  --preview-color: #3b82f6;
  position: fixed;
  z-index: 80;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--preview-color) 46%, white);
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.86);
  pointer-events: none;
}

.symbol-drag-preview__core {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
}

.symbol-drag-preview__core :deep(svg) {
  width: 13px;
  height: 13px;
}

@media (min-width: 961px) {
  .app.sidebar-open .map-wrapper {
    padding-left: 424px;
  }
  
  .app:not(.sidebar-open) .map-wrapper {
    padding-left: 64px;
  }
}

@media (max-width: 960px) {
  .app-empty-state {
    align-items: flex-start;
    padding: 76px 18px 24px;
  }

  .app-empty-state__card {
    width: 100%;
    max-width: none;
    padding: 22px 20px;
    border-radius: 24px;
    text-align: left;
  }

  .app-empty-state h1 {
    font-size: 30px;
  }

  .app-floating-brand {
    top: 14px;
    left: 50%;
    right: auto;
    width: auto;
    max-width: calc(100% - 32px);
    padding: 8px 12px;
  }
}
</style>
