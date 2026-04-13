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
      :project-name="projectName"
      @toggle="toggleSidebar"
      @close="closeSidebar"
      @open-section="openSection"
      @gpx-files="onGpxFiles"
      @update:project-name="projectName = $event"
      @fit-project="onFitProject"
      @fit-track="onFitTrack"
      @remove-track="onRemoveTrack"
      @start-symbol-drag="onStartSymbolDrag"
      @upload-svg="onUploadSvg"
      @update-symbol-size="onUpdateSymbolSize"
      @update-symbol-transform="onUpdateSymbolTransform"
      @track-width-change="onWidthChange"
      @update:map-settings="mapSettings = $event"
      @export-zip="exportProjectZip"
      @import-zip="importProjectZip"
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
        :saved-camera="mapCamera"
        :camera-restore-key="cameraRestoreKey"
        :fit-request="fitRequest"
        :render-session-id="projectLoadOverlay?.sessionId ?? 0"
        @add-symbol="onAddSymbol"
        @complete-symbol-drag="onCompleteSymbolDrag"
        @project-render-progress="onProjectRenderProgress"
        @remove-symbol="onRemoveSymbol"
        @select-symbol="onSelectSymbol"
        @update-camera="mapCamera = $event"
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

      <div v-if="pendingResumeProject" class="app-resume-state">
        <div class="app-resume-state__card">
          <div class="app-resume-state__eyebrow">Projet retrouve</div>
          <h2>Reprendre ton dernier projet ?</h2>
          <p>
            <strong>{{ pendingResumeProject.projectName }}</strong>
            <span v-if="pendingResumeProject.savedAtLabel">
              sauvegarde le {{ pendingResumeProject.savedAtLabel }}
            </span>
          </p>

          <div class="app-resume-state__actions">
            <button type="button" class="app-resume-state__primary" @click="resumeSavedProject">
              Reprendre
            </button>

            <button type="button" class="app-resume-state__secondary" @click="dismissSavedProject">
              Nouveau projet
            </button>
          </div>
        </div>
      </div>

      <div v-if="projectLoadOverlay" class="app-load-state">
        <div class="app-load-state__card">
          <div class="app-load-state__eyebrow">Chargement du projet</div>
          <h2>{{ projectLoadOverlay.title }}</h2>
          <p>{{ projectLoadOverlay.currentLabel }}</p>

          <div
            class="app-load-state__bar"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="projectLoadOverlay.progress"
          >
            <span
              class="app-load-state__bar-fill"
              :style="{ width: `${projectLoadOverlay.progress}%` }"
            ></span>
          </div>

          <div class="app-load-state__meta">
            <strong>{{ projectLoadOverlay.progress }}%</strong>
            <span>{{ projectLoadOverlay.completedCount }}/{{ projectLoadOverlay.steps.length }} ok</span>
          </div>

          <ul class="app-load-state__steps">
            <li
              v-for="step in projectLoadOverlay.steps"
              :key="step.id"
              class="app-load-state__step"
              :class="`is-${step.status}`"
            >
              <span class="app-load-state__step-icon" aria-hidden="true">
                <svg
                  v-if="step.status === 'done'"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4.5 10.5 8 14l7.5-8" />
                </svg>
                <svg
                  v-else-if="step.status === 'active'"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <path d="M10 3.5a6.5 6.5 0 1 1-6.5 6.5" opacity="0.35" />
                  <path d="M10 3.5a6.5 6.5 0 0 1 5.3 2.7" />
                </svg>
              </span>
              <span class="app-load-state__step-label">{{ step.label }}</span>
            </li>
          </ul>
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
import { computed, onMounted, ref, watch } from 'vue'
import { gpx } from '@mapbox/togeojson'
import JSZip from 'jszip'
import localforage from 'localforage'
import MapView from './components/MapView.vue'
import type { MapSettings } from './components/sidebar/map-settings'
import SidebarPanel from './components/sidebar/SidebarPanel.vue'
import type { SidebarSection, SidebarSectionId } from './components/sidebar/types'
import type { GpxTrack } from './types/gpx'
import {
  PROJECT_ARCHIVE_NAME,
  PROJECT_STORAGE_KEY,
  PROJECT_VERSION,
  type MapCameraState,
  type BikeparkProject,
} from './types/project'
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
const projectName = ref('Mon bikepark')
const mapCamera = ref<MapCameraState | null>(null)
const cameraRestoreKey = ref(0)
const draggingSymbolId = ref<SymbolId | null>(null)
const selectedSymbolId = ref<string | null>(null)
const dragPointer = ref({ x: 0, y: 0 })
const fitRequest = ref<{ type: 'project' | 'track'; trackId?: string; nonce: number } | null>(null)
const isSidebarOpen = ref(false)
const hasStartedWelcome = ref(false)
const activeSection = ref<SidebarSectionId>('track')
const mapSettings = ref<MapSettings>({
  terrain: 1.4,
  hillshade: 100,
  labelFont: 'segoe',
})
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const saveStatusMessage = ref('')
const lastSavedAt = ref<string | null>(null)
const hasSavedProject = ref(false)
const hasHydratedProject = ref(false)
const pendingSavedProject = ref<BikeparkProject | null>(null)
const showResumePrompt = ref(false)
const projectLoadSessionId = ref(0)
const projectLoadState = ref<{
  sessionId: number
  title: string
  steps: {
    id: 'read' | 'tracks' | 'symbols' | 'customSymbols' | 'settings' | 'camera' | 'map'
    label: string
    status: 'pending' | 'active' | 'done'
  }[]
} | null>(null)
let stopSymbolDragListeners: (() => void) | null = null
let saveProjectTimer: number | null = null

const dragPreview = computed(() => {
  if (!draggingSymbolId.value) return null
  return getSymbolDefinition(draggingSymbolId.value, customSymbols.value)
})

const isProjectEmpty = computed(() => {
  return tracks.value.length === 0 && symbols.value.length === 0
})

const showWelcomeCard = computed(() => {
  return isProjectEmpty.value && !hasStartedWelcome.value && !showResumePrompt.value
})

const pendingResumeProject = computed(() => {
  if (!showResumePrompt.value || !pendingSavedProject.value || hasStartedWelcome.value || !isProjectEmpty.value) return null

  const savedAt = new Date(pendingSavedProject.value.savedAt)
  const savedAtLabel = Number.isNaN(savedAt.getTime()) ? '' : savedAt.toLocaleString()

  return {
    projectName: pendingSavedProject.value.projectName,
    savedAtLabel,
  }
})

const projectLoadOverlay = computed(() => {
  const state = projectLoadState.value
  if (!state) return null

  const completedCount = state.steps.filter((step) => step.status === 'done').length
  const progress = state.steps.length === 0 ? 0 : Math.round((completedCount / state.steps.length) * 100)
  const currentStep = state.steps.find((step) => step.status === 'active')
  const currentLabel = currentStep?.label ?? (completedCount === state.steps.length ? 'Finalisation terminee.' : 'Preparation du projet...')

  return {
    ...state,
    completedCount,
    progress,
    currentLabel,
  }
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
  pendingSavedProject.value = null
  showResumePrompt.value = false
  hasStartedWelcome.value = true
  activeSection.value = 'track'
  isSidebarOpen.value = true
}

function inferProjectName() {
  const firstNamedTrack = tracks.value.find((track) => track.label.trim() || track.name.trim())
  return firstNamedTrack?.label?.trim() || firstNamedTrack?.name?.trim() || 'Mon bikepark'
}

function sanitizeProjectName(value: string) {
  const sanitized = value.trim().replace(/\s+/g, ' ')
  return sanitized || inferProjectName()
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count > 1 ? plural : singular}`
}

function createProjectLoadSteps(project: BikeparkProject) {
  return [
    {
      id: 'read',
      label: 'Lecture du projet',
      status: 'active',
    },
    {
      id: 'tracks',
      label: pluralize(project.tracks.length, 'track', 'tracks'),
      status: 'pending',
    },
    {
      id: 'symbols',
      label: pluralize(project.symbols.length, 'symbole', 'symboles'),
      status: 'pending',
    },
    {
      id: 'customSymbols',
      label: pluralize(project.customSymbols.length, 'symbole perso', 'symboles perso'),
      status: 'pending',
    },
    {
      id: 'settings',
      label: 'Reglages carte',
      status: 'pending',
    },
    {
      id: 'camera',
      label: 'Camera',
      status: 'pending',
    },
    {
      id: 'map',
      label: 'Rendu carte',
      status: 'pending',
    },
  ] satisfies {
    id: 'read' | 'tracks' | 'symbols' | 'customSymbols' | 'settings' | 'camera' | 'map'
    label: string
    status: 'pending' | 'active' | 'done'
  }[]
}

function updateProjectLoadStep(
  id: 'read' | 'tracks' | 'symbols' | 'customSymbols' | 'settings' | 'camera' | 'map',
  status: 'pending' | 'active' | 'done',
) {
  if (!projectLoadState.value) return

  projectLoadState.value = {
    ...projectLoadState.value,
    steps: projectLoadState.value.steps.map((step) => {
      if (step.id !== id) return step
      return { ...step, status }
    }),
  }
}

function beginProjectLoad(title: string, project: BikeparkProject) {
  projectLoadSessionId.value += 1
  projectLoadState.value = {
    sessionId: projectLoadSessionId.value,
    title,
    steps: createProjectLoadSteps(project),
  }
}

function finishProjectLoad(sessionId: number) {
  if (!projectLoadState.value || projectLoadState.value.sessionId !== sessionId) return

  projectLoadState.value = {
    ...projectLoadState.value,
    steps: projectLoadState.value.steps.map((step) => ({ ...step, status: 'done' })),
  }

  window.setTimeout(() => {
    if (projectLoadState.value?.sessionId === sessionId) {
      projectLoadState.value = null
    }
  }, 500)
}

function slugifyProjectName(value: string) {
  return sanitizeProjectName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'bikepark-project'
}

function createProjectSnapshot(): BikeparkProject {
  return {
    version: PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    projectName: sanitizeProjectName(projectName.value),
    hasStartedWelcome: hasStartedWelcome.value,
    tracks: JSON.parse(JSON.stringify(tracks.value)) as GpxTrack[],
    symbols: JSON.parse(JSON.stringify(symbols.value)) as MapSymbol[],
    customSymbols: JSON.parse(JSON.stringify(customSymbols.value)) as SymbolDefinition[],
    mapSettings: JSON.parse(JSON.stringify(mapSettings.value)) as MapSettings,
    mapCamera: JSON.parse(JSON.stringify(mapCamera.value)) as MapCameraState | null,
  }
}

function normalizeProject(raw: Partial<BikeparkProject> | null | undefined): BikeparkProject {
  return {
    version: typeof raw?.version === 'number' ? raw.version : PROJECT_VERSION,
    savedAt: typeof raw?.savedAt === 'string' ? raw.savedAt : new Date().toISOString(),
    projectName:
      typeof raw?.projectName === 'string' && raw.projectName.trim()
        ? raw.projectName.trim()
        : 'Mon bikepark',
    hasStartedWelcome: Boolean(raw?.hasStartedWelcome),
    tracks: Array.isArray(raw?.tracks) ? raw.tracks : [],
    symbols: Array.isArray(raw?.symbols) ? raw.symbols : [],
    customSymbols: Array.isArray(raw?.customSymbols) ? raw.customSymbols : [],
    mapSettings: {
      terrain: Number(raw?.mapSettings?.terrain ?? 1.4),
      hillshade: Number(raw?.mapSettings?.hillshade ?? 100),
      labelFont: raw?.mapSettings?.labelFont ?? 'segoe',
    },
    mapCamera:
      raw?.mapCamera &&
      Array.isArray(raw.mapCamera.center) &&
      raw.mapCamera.center.length === 2
        ? {
            center: [Number(raw.mapCamera.center[0]), Number(raw.mapCamera.center[1])],
            zoom: Number(raw.mapCamera.zoom ?? 14),
            pitch: Number(raw.mapCamera.pitch ?? 0),
            bearing: Number(raw.mapCamera.bearing ?? 0),
          }
        : null,
  }
}

function applyProject(project: BikeparkProject) {
  updateProjectLoadStep('read', 'done')
  updateProjectLoadStep('tracks', 'active')
  tracks.value = project.tracks
  updateProjectLoadStep('tracks', 'done')
  updateProjectLoadStep('symbols', 'active')
  symbols.value = project.symbols
  updateProjectLoadStep('symbols', 'done')
  updateProjectLoadStep('customSymbols', 'active')
  customSymbols.value = project.customSymbols
  updateProjectLoadStep('customSymbols', 'done')
  updateProjectLoadStep('settings', 'active')
  mapSettings.value = project.mapSettings
  updateProjectLoadStep('settings', 'done')
  updateProjectLoadStep('camera', 'active')
  mapCamera.value = project.mapCamera
  cameraRestoreKey.value += 1
  updateProjectLoadStep('camera', 'done')
  updateProjectLoadStep('map', 'active')
  projectName.value = sanitizeProjectName(project.projectName)
  hasStartedWelcome.value = project.hasStartedWelcome || project.tracks.length > 0 || project.symbols.length > 0
  selectedSymbolId.value = null
  saveStatus.value = 'saved'
  saveStatusMessage.value = 'Projet recharge.'
  lastSavedAt.value = project.savedAt
  hasSavedProject.value = true
}

async function saveProjectToBrowser() {
  try {
    saveStatus.value = 'saving'
    saveStatusMessage.value = 'Sauvegarde locale en cours.'

    const snapshot = createProjectSnapshot()
    await localforage.setItem(PROJECT_STORAGE_KEY, snapshot)

    lastSavedAt.value = snapshot.savedAt
    hasSavedProject.value = true
    saveStatus.value = 'saved'
    saveStatusMessage.value = 'Projet enregistre dans ce navigateur.'
  } catch (error) {
    console.error(error)
    saveStatus.value = 'error'
    saveStatusMessage.value = 'Impossible de sauvegarder dans le navigateur.'
  }
}

function queueProjectSave() {
  if (!hasHydratedProject.value) return

  if (saveProjectTimer !== null) {
    window.clearTimeout(saveProjectTimer)
  }

  saveProjectTimer = window.setTimeout(() => {
    saveProjectTimer = null
    void saveProjectToBrowser()
  }, 350)
}

async function restoreProjectFromBrowser() {
  try {
    const stored = await localforage.getItem<BikeparkProject>(PROJECT_STORAGE_KEY)
    if (!stored) {
      hasSavedProject.value = false
      saveStatus.value = 'idle'
      saveStatusMessage.value = ''
      return
    }

    applyProject(normalizeProject(stored))
  } catch (error) {
    console.error(error)
    saveStatus.value = 'error'
    saveStatusMessage.value = 'Impossible de relire la sauvegarde locale.'
  }
}

async function hydrateInitialProjectState() {
  try {
    const stored = await localforage.getItem<BikeparkProject>(PROJECT_STORAGE_KEY)
    if (!stored) {
      hasSavedProject.value = false
      saveStatus.value = 'idle'
      saveStatusMessage.value = ''
      hasHydratedProject.value = true
      return
    }

    const project = normalizeProject(stored)
    mapCamera.value = project.mapCamera
    pendingSavedProject.value = project
    showResumePrompt.value = true
    hasSavedProject.value = true
    lastSavedAt.value = project.savedAt
    saveStatus.value = 'idle'
    saveStatusMessage.value = ''
  } catch (error) {
    console.error(error)
    saveStatus.value = 'error'
    saveStatusMessage.value = 'Impossible de relire la sauvegarde locale.'
    hasHydratedProject.value = true
  }
}

function resumeSavedProject() {
  if (!pendingSavedProject.value) {
    hasHydratedProject.value = true
    return
  }

  const project = pendingSavedProject.value
  showResumePrompt.value = false
  pendingSavedProject.value = null
  beginProjectLoad('Reprise de la sauvegarde', project)
  applyProject(project)
  hasHydratedProject.value = true
}

function dismissSavedProject() {
  showResumePrompt.value = false
  pendingSavedProject.value = null
  mapCamera.value = null
  cameraRestoreKey.value += 1
  hasHydratedProject.value = true
}

async function clearProjectFromBrowser() {
  try {
    await localforage.removeItem(PROJECT_STORAGE_KEY)
    hasSavedProject.value = false
    saveStatus.value = 'idle'
    saveStatusMessage.value = 'Sauvegarde locale effacee.'
    lastSavedAt.value = null
  } catch (error) {
    console.error(error)
    saveStatus.value = 'error'
    saveStatusMessage.value = 'Impossible d effacer la sauvegarde locale.'
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function exportProjectZip() {
  try {
    const snapshot = createProjectSnapshot()
    const zip = new JSZip()
    zip.file(PROJECT_ARCHIVE_NAME, JSON.stringify(snapshot, null, 2))

    const blob = await zip.generateAsync({ type: 'blob' })
    const stamp = snapshot.savedAt.slice(0, 10)
    downloadBlob(blob, `${slugifyProjectName(snapshot.projectName)}-${stamp}.zip`)
    saveStatusMessage.value = 'ZIP exporte.'
  } catch (error) {
    console.error(error)
    saveStatus.value = 'error'
    saveStatusMessage.value = 'Impossible d exporter le ZIP.'
  }
}

async function importProjectZip(file: File) {
  try {
    const zip = await JSZip.loadAsync(file)
    const projectEntry = zip.file(PROJECT_ARCHIVE_NAME)

    if (!projectEntry) {
      saveStatus.value = 'error'
      saveStatusMessage.value = `Le ZIP doit contenir ${PROJECT_ARCHIVE_NAME}.`
      return
    }

    const content = await projectEntry.async('string')
    const parsed = JSON.parse(content) as BikeparkProject
    const project = normalizeProject(parsed)

    beginProjectLoad('Import du projet ZIP', project)
    applyProject(project)
    await saveProjectToBrowser()
  } catch (error) {
    console.error(error)
    saveStatus.value = 'error'
    saveStatusMessage.value = 'Le ZIP n a pas pu etre importe.'
  }
}

function onWidthChange(_track: GpxTrack) {
  // La reactivite naturelle de Vue devrait suffire.
}

function onFitProject() {
  fitRequest.value = {
    type: 'project',
    nonce: Date.now(),
  }
}

function onFitTrack(trackId: string) {
  fitRequest.value = {
    type: 'track',
    trackId,
    nonce: Date.now(),
  }
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

function onProjectRenderProgress(payload: {
  sessionId: number
  stage: 'tracks' | 'symbols' | 'map'
  loaded: number
  total: number
}) {
  if (!projectLoadState.value || payload.sessionId !== projectLoadState.value.sessionId) return

  if (payload.stage === 'tracks') {
    updateProjectLoadStep('tracks', payload.total === 0 || payload.loaded >= payload.total ? 'done' : 'active')
    return
  }

  if (payload.stage === 'symbols') {
    updateProjectLoadStep('symbols', payload.total === 0 || payload.loaded >= payload.total ? 'done' : 'active')
    return
  }

  if (payload.stage === 'map') {
    updateProjectLoadStep('map', 'done')
    finishProjectLoad(payload.sessionId)
  }
}

async function onGpxFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return

  const importedTracks: GpxTrack[] = []
  const startIndex = tracks.value.length

  for (const [index, file] of Array.from(files).entries()) {
    const text = await file.text()
    const xml = new DOMParser().parseFromString(text, 'application/xml')
    const geojson = gpx(xml) as GeoJSON.FeatureCollection

    const baseName = file.name.replace(/\.gpx$/i, '')

    importedTracks.push({
      id: uid(),
      name: baseName,
      color: predefinedColors[(startIndex + index) % predefinedColors.length],
      width: 4,
      style: 'solid',
      label: baseName,
      visible: true,
      labelSize: 16,
      labelStyle: 'classic',
      geojson,
    })
  }

  tracks.value = [...tracks.value, ...importedTracks]
  hasStartedWelcome.value = true
  activeSection.value = 'track'
  isSidebarOpen.value = true
  input.value = ''
}

onMounted(async () => {
  await hydrateInitialProjectState()
})

watch(
  [tracks, symbols, customSymbols, mapSettings, hasStartedWelcome, projectName],
  () => {
    queueProjectSave()
  },
  { deep: true },
)
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

.app-resume-state {
  position: absolute;
  inset: 0;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(2, 6, 23, 0.3);
  backdrop-filter: blur(8px);
}

.app-load-state {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(2, 6, 23, 0.42);
  backdrop-filter: blur(12px);
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

.app-resume-state__card {
  max-width: 460px;
  padding: 28px;
  border: 1px solid rgba(96, 165, 250, 0.26);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.9)),
    radial-gradient(circle at top, rgba(96, 165, 250, 0.14), transparent 58%);
  color: #f8fafc;
  text-align: center;
  box-shadow:
    0 24px 60px rgba(2, 6, 23, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.app-load-state__card {
  width: min(460px, 100%);
  padding: 28px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.92)),
    radial-gradient(circle at top, rgba(96, 165, 250, 0.18), transparent 58%);
  color: #f8fafc;
  box-shadow:
    0 24px 60px rgba(2, 6, 23, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.app-empty-state__eyebrow {
  margin-bottom: 10px;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.app-resume-state__eyebrow {
  margin-bottom: 10px;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.app-load-state__eyebrow {
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

.app-resume-state h2 {
  margin: 0 0 10px;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1;
  letter-spacing: -0.04em;
}

.app-load-state h2 {
  margin: 0 0 10px;
  font-size: clamp(28px, 4vw, 36px);
  line-height: 1;
  letter-spacing: -0.04em;
}

.app-empty-state p {
  margin: 0;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.6;
}

.app-resume-state p {
  margin: 0;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.65;
}

.app-load-state p {
  margin: 0 0 18px;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.65;
}

.app-load-state__bar {
  position: relative;
  width: 100%;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.95);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.04);
}

.app-load-state__bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  box-shadow: 0 0 28px rgba(59, 130, 246, 0.4);
  transition: width 0.24s ease;
}

.app-load-state__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  color: #cbd5e1;
  font-size: 13px;
}

.app-load-state__meta strong {
  color: #f8fafc;
  font-size: 18px;
  letter-spacing: -0.03em;
}

.app-load-state__steps {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.app-load-state__step {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.68);
  color: #cbd5e1;
}

.app-load-state__step.is-done {
  border-color: rgba(96, 165, 250, 0.3);
  background: rgba(15, 23, 42, 0.84);
  color: #eff6ff;
}

.app-load-state__step.is-active {
  border-color: rgba(96, 165, 250, 0.4);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(15, 23, 42, 0.84));
  color: #f8fafc;
}

.app-load-state__step-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  min-height: 28px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.9);
  color: #93c5fd;
}

.app-load-state__step.is-done .app-load-state__step-icon {
  background: rgba(30, 64, 175, 0.28);
  color: #dbeafe;
}

.app-load-state__step.is-active .app-load-state__step-icon svg {
  animation: app-load-spin 0.9s linear infinite;
}

.app-load-state__step-icon svg {
  width: 15px;
  height: 15px;
}

.app-load-state__step-label {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
}

@keyframes app-load-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.app-resume-state p strong {
  color: #f8fafc;
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

.app-resume-state__actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.app-resume-state__primary,
.app-resume-state__secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 138px;
  padding: 12px 18px;
  border-radius: 999px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    filter 0.16s ease,
    border-color 0.16s ease;
}

.app-resume-state__primary {
  border: 1px solid rgba(96, 165, 250, 0.42);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.88), rgba(59, 130, 246, 0.88));
  color: #eff6ff;
  box-shadow:
    0 16px 34px rgba(30, 64, 175, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.app-resume-state__secondary {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.66);
  color: #e2e8f0;
}

.app-resume-state__primary:hover,
.app-resume-state__secondary:hover {
  transform: translateY(-1px);
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

  .app-resume-state {
    align-items: flex-start;
    padding: 76px 18px 24px;
  }

  .app-load-state {
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

  .app-resume-state__card {
    width: 100%;
    max-width: none;
    padding: 22px 20px;
    border-radius: 24px;
    text-align: left;
  }

  .app-load-state__card {
    width: 100%;
    max-width: none;
    padding: 22px 20px;
    border-radius: 24px;
  }

  .app-empty-state h1 {
    font-size: 30px;
  }

  .app-resume-state h2 {
    font-size: 28px;
  }

  .app-load-state h2 {
    font-size: 28px;
  }

  .app-resume-state__actions {
    flex-direction: column;
    align-items: stretch;
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
