<template>
  <div v-if="!authReady" class="auth-loading">{{ t('loading') }}</div>

  <LoginView v-else-if="!authSession" />

  <div v-else class="app" :class="{ 'sidebar-open': isSidebarOpen }">
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
      :spot-status="currentSpotStatus"
      :projects="projects"
      :current-project-id="currentProjectId"
      :is-admin="authIsAdmin"
      @toggle="toggleSidebar"
      @select-project="onSelectProject"
      @new-project="onNewProject"
      @delete-project="onDeleteProject"
      @close="closeSidebar"
      @open-section="openSection"
      @gpx-files="onGpxFiles"
      @update:project-name="projectName = $event"
      @fit-project="onFitProject"
      @fit-track="onFitTrack"
      @remove-track="onRemoveTrack"
      @new-track="beginNewTrack"
      @edit-track="beginEditTrack"
      @request-publication="onRequestPublication"
      @cancel-publication="onCancelPublication"
      @propose-to-spot="onProposeToSpot"
      @locate="onLocate"
      @start-symbol-drag="onStartSymbolDrag"
      @remove-symbol="onRemoveSymbol"
      @start-move-symbol="onStartMoveSymbol"
      @pick-symbol="onPickSymbol"
      @upload-svg="onUploadSvg"
      @update-symbol-size="onUpdateSymbolSize"
      @update-symbol-transform="onUpdateSymbolTransform"
      @track-width-change="onWidthChange"
      @update:map-settings="mapSettings = $event"
      @export-zip="exportProjectZip"
      @import-zip="importProjectZip"
      @start-tour="launchTour"
    />

    <main class="map-wrapper" data-tour="map">
      <MapView
        ref="mapViewRef"
        :tracks="tracks"
        :symbols="symbols"
        :custom-symbols="customSymbols"
        :dragging-symbol-type="draggingSymbolId"
        :drag-pointer="dragPointer"
        :terrain-exaggeration="mapSettings.terrain"
        :hillshade-strength="mapSettings.hillshade"
        :label-font="mapSettings.labelFont"
        :show-pista-trails="mapSettings.showPistaTrails"
        :show-heatmap="mapSettings.showHeatmap"
        :reposition-symbol-id="repositionSymbolId"
        :pending-add-symbol-type="pendingAddSymbolType"
        :saved-camera="mapCamera"
        :camera-restore-key="cameraRestoreKey"
        :fit-request="fitRequest"
        :render-session-id="activeProjectRenderSessionId"
        @add-symbol="onAddSymbol"
        @complete-symbol-drag="onCompleteSymbolDrag"
        @project-render-progress="onProjectRenderProgress"
        @remove-symbol="onRemoveSymbol"
        @select-symbol="onSelectSymbol"
        @update-camera="onUpdateCamera"
        @update-symbol-size="onUpdateSymbolSize"
        @update-symbol-position="onUpdateSymbolPosition"
        @update-label-position="onUpdateLabelPosition"
        @track-drawn="onTrackDrawn"
        @track-geometry-updated="onTrackGeometryUpdated"
        @editor-closed="onEditorClosed"
        @editor-state="onEditorState"
        @symbol-repositioned="onSymbolRepositioned"
        @request-move-symbol="onStartMoveSymbol"
      />

      <div v-if="editorMode !== 'idle'" class="track-editor-bar">
        <div class="track-editor-bar__modes">
          <button
            type="button"
            class="track-editor-bar__mode"
            :class="{ active: editorMode === 'draw' }"
            @click="setEditorMode('draw')"
          >
            {{ t('editor.modeDraw') }}
          </button>
          <button
            type="button"
            class="track-editor-bar__mode"
            :class="{ active: editorMode === 'edit' }"
            @click="setEditorMode('edit')"
          >
            {{ t('editor.modeEdit') }}
          </button>
        </div>
        <span class="track-editor-bar__hint">
          {{ editorMode === 'draw' ? t('editor.drawHint') : t('editor.editHint') }}
        </span>
        <div class="track-editor-bar__actions">
          <button
            type="button"
            class="track-editor-bar__btn"
            :disabled="!editorCanUndo"
            @click="editorUndo"
          >
            {{ t('editor.undo') }}
          </button>
          <button
            type="button"
            class="track-editor-bar__btn primary"
            :disabled="editorPointCount < 2"
            @click="commitEdit"
          >
            {{ t('editor.finish') }}
          </button>
          <button type="button" class="track-editor-bar__btn" @click="cancelEdit">
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>

<div v-if="projectLoadOverlay" class="app-load-state">
        <div class="app-load-state__card">
          <button
            type="button"
            class="app-load-state__dismiss"
            aria-label="Masquer le panneau de chargement"
            @click="dismissProjectLoadOverlay"
          >
            Fermer
          </button>
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
      <span class="app-floating-brand__name">{{ t('app.name') }}</span>
    </div>

    <div class="account-chip">
      <span class="account-chip__email" :title="authUser?.email ?? ''">{{ authUser?.email }}</span>
      <button type="button" class="account-chip__logout" :title="t('account.logout')" @click="onSignOut">
        {{ t('account.logout') }}
      </button>
    </div>

    <div v-if="submitToast" class="submit-toast">{{ submitToast }}</div>

    <div v-if="repositionSymbolId || pendingAddSymbolType" class="symbol-action-bar">
      <span class="symbol-action-bar__label">
        {{ pendingAddSymbolType ? t('reposition.add') : t('reposition.move') }}
      </span>
      <button
        type="button"
        class="symbol-action-bar__btn"
        @click="repositionSymbolId = null; pendingAddSymbolType = null"
      >
        {{ t('common.cancel') }}
      </button>
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
import { useI18n } from 'vue-i18n'
import { gpx } from '@mapbox/togeojson'
import JSZip from 'jszip'
import localforage from 'localforage'
import MapView from './components/MapView.vue'
import LoginView from './components/LoginView.vue'
import { useAuth } from './lib/useAuth'
import { loadUserProject, saveUserProject, submitProject, requestPublication, cancelPublication, getSpotStatus, listUserProjects, loadProjectById, createProject, deleteUserProject, proposeTrailsToSpot, type ProjectListItem, type SubmitTrail } from './lib/projectsStore'
import { hasSeenTour, startTour } from './lib/useTour'
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

const { t } = useI18n()
const { session: authSession, ready: authReady, user: authUser, isAdmin: authIsAdmin, signOut } = useAuth()

async function onSignOut() {
  await signOut()
}

const predefinedColors = [
  '#22c55e',
  '#dcb469',
  '#ef4444',
  '#000000',
  '#6b7280',
  '#ffffff',
  '#fbbf24',
  '#92400e',
]

const sidebarSections = computed<SidebarSection[]>(() =>
  (['track', 'symbol', 'map', 'locate', 'export', 'help'] as const).map((id) => ({
    id,
    icon: id.charAt(0).toUpperCase(),
    title: t(`sections.${id}.title`),
    description: t(`sections.${id}.desc`),
    placeholder: '',
  })),
)

const tracks = ref<GpxTrack[]>([])
const mapViewRef = ref<{
  beginDrawTrack: () => void
  beginEditTrack: (track: GpxTrack) => void
  commitEditor: () => void
  cancelEditor: () => void
  setEditorMode: (mode: 'draw' | 'edit') => void
  editorUndo: () => void
  flyTo: (lng: number, lat: number, zoom?: number) => void
} | null>(null)

function onLocate(payload: { lng: number; lat: number; label: string }) {
  mapViewRef.value?.flyTo(payload.lng, payload.lat, 14)
}
const editorMode = ref<'idle' | 'draw' | 'edit'>('idle')
const editorPointCount = ref(0)
const editorCanUndo = ref(false)

function onEditorState(payload: { mode: 'draw' | 'edit'; pointCount: number; canUndo: boolean }) {
  if (editorMode.value !== 'idle') editorMode.value = payload.mode
  editorPointCount.value = payload.pointCount
  editorCanUndo.value = payload.canUndo
}
function setEditorMode(mode: 'draw' | 'edit') {
  editorMode.value = mode
  mapViewRef.value?.setEditorMode(mode)
}
function editorUndo() {
  mapViewRef.value?.editorUndo()
}
const symbols = ref<MapSymbol[]>([])
const customSymbols = ref<SymbolDefinition[]>([])
const projectName = ref('Mon bikepark')
const mapCamera = ref<MapCameraState | null>(null)
const cameraRestoreKey = ref(0)
const draggingSymbolId = ref<SymbolId | null>(null)
const selectedSymbolId = ref<string | null>(null)
const repositionSymbolId = ref<string | null>(null)
const pendingAddSymbolType = ref<SymbolId | null>(null)
const dragPointer = ref({ x: 0, y: 0 })
const fitRequest = ref<{ type: 'project' | 'track'; trackId?: string; nonce: number } | null>(null)
const isSidebarOpen = ref(false)
const hasStartedWelcome = ref(false)
const activeSection = ref<SidebarSectionId>('track')
const mapSettings = ref<MapSettings>({
  terrain: 1.4,
  hillshade: 100,
  labelFont: 'segoe',
  showPistaTrails: true,
  showHeatmap: false,
})
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const saveStatusMessage = ref('')
const lastSavedAt = ref<string | null>(null)
const hasSavedProject = ref(false)
const hasHydratedProject = ref(false)
const currentProjectId = ref<string | null>(null)
const currentSpotId = ref<string | null>(null)
const currentSpotStatus = ref<import('./lib/projectsStore').SpotStatus | null>(null)
const projects = ref<ProjectListItem[]>([])
const submitToast = ref('')
let pistaSyncTimer: number | null = null
let pistaSyncing = false

function showToast(msg: string) {
  submitToast.value = msg
  window.setTimeout(() => (submitToast.value = ''), 6000)
}

// Construit une géométrie MultiLineString à partir d'une trace de l'éditeur.
function trackToGeometry(track: GpxTrack): GeoJSON.MultiLineString | null {
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

// Synchronise le brouillon (spot + trails 'draft') dans Pista : visible dans
// l'espace privé de l'utilisateur dès qu'il travaille sur un spot.
function buildTrailsPayload(): SubmitTrail[] {
  return tracks.value
    .map((t) => {
      const geometry = trackToGeometry(t)
      if (!geometry) return null
      return {
        name: t.label?.trim() || t.name?.trim() || 'Piste',
        trail_type: t.trailType ?? 'enduro',
        difficulty: t.difficulty ?? 'blue',
        geometry,
      } as SubmitTrail
    })
    .filter((t): t is SubmitTrail => t !== null)
}

async function onProposeToSpot(payload: { id: string; name: string }) {
  const trails = buildTrailsPayload()
  if (trails.length === 0) return
  const n = await proposeTrailsToSpot(payload.id, trails)
  if (n === null) {
    showToast(t('toast.contribFail'))
    return
  }
  showToast(t('toast.contribSent', { n, spot: payload.name }))
}

async function syncPistaDraft() {
  if (pistaSyncing || !currentProjectId.value) return
  // Un spot soumis (en revue) ou publié est gelé : on ne le modifie pas en arrière-plan.
  if (currentSpotStatus.value === 'submitted' || currentSpotStatus.value === 'published') return
  const trails = buildTrailsPayload()
  if (trails.length === 0) return

  pistaSyncing = true
  try {
    const { spotId } = await submitProject({
      name: sanitizeProjectName(projectName.value),
      region: '',
      spotType: 'bikepark',
      projectId: currentProjectId.value,
      trails,
    })
    if (spotId) {
      currentSpotId.value = spotId
      if (!currentSpotStatus.value) currentSpotStatus.value = 'draft'
    }
  } finally {
    pistaSyncing = false
  }
}

function queuePistaSync() {
  if (!hasHydratedProject.value) return
  if (pistaSyncTimer !== null) window.clearTimeout(pistaSyncTimer)
  pistaSyncTimer = window.setTimeout(() => {
    pistaSyncTimer = null
    void syncPistaDraft()
  }, 2000)
}

async function onRequestPublication() {
  if (!currentSpotId.value) return
  const err = await requestPublication(currentSpotId.value)
  if (err) {
    showToast(t('toast.pubFail'))
    return
  }
  currentSpotStatus.value = 'submitted'
  showToast(t('toast.pubRequested'))
}

async function onCancelPublication() {
  if (!currentSpotId.value) return
  const err = await cancelPublication(currentSpotId.value)
  if (err) {
    showToast(t('toast.cancelFail'))
    return
  }
  currentSpotStatus.value = 'draft'
  showToast(t('toast.cancelled'))
  queuePistaSync() // pousse les éventuelles modifs faites pendant l’attente
}

const projectLoadSessionId = ref(0)
const dismissedProjectLoadSessionId = ref<number | null>(null)
let projectLoadFinishTimer: number | null = null
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

const projectLoadOverlay = computed(() => {
  const state = projectLoadState.value
  if (!state || dismissedProjectLoadSessionId.value === state.sessionId) return null

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

const activeProjectRenderSessionId = computed(() => projectLoadState.value?.sessionId ?? 0)

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

function launchTour() {
  startTour({
    openSection,
    setSidebarOpen: (open) => {
      isSidebarOpen.value = open
    },
  })
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
  ] satisfies {
    id: 'read' | 'tracks' | 'symbols' | 'customSymbols' | 'settings' | 'camera'
    label: string
    status: 'pending' | 'active' | 'done'
  }[]
}

function updateProjectLoadStep(
  id: 'read' | 'tracks' | 'symbols' | 'customSymbols' | 'settings' | 'camera',
  status: 'pending' | 'active' | 'done',
) {
  if (!projectLoadState.value) return

  let hasChanged = false
  const nextSteps = projectLoadState.value.steps.map((step) => {
    if (step.id !== id) return step
    if (step.status === status) return step
    hasChanged = true
    return { ...step, status }
  })

  if (!hasChanged) return
  projectLoadState.value = {
    ...projectLoadState.value,
    steps: nextSteps,
  }
}

function beginProjectLoad(title: string, project: BikeparkProject) {
  projectLoadSessionId.value += 1
  dismissedProjectLoadSessionId.value = null
  if (projectLoadFinishTimer !== null) {
    window.clearTimeout(projectLoadFinishTimer)
    projectLoadFinishTimer = null
  }
  projectLoadState.value = {
    sessionId: projectLoadSessionId.value,
    title,
    steps: createProjectLoadSteps(project),
  }
}

function dismissProjectLoadOverlay() {
  if (!projectLoadState.value) return
  dismissedProjectLoadSessionId.value = projectLoadState.value.sessionId
}

function finishProjectLoad(sessionId: number) {
  if (!projectLoadState.value || projectLoadState.value.sessionId !== sessionId) return

  const allDone = projectLoadState.value.steps.every((step) => step.status === 'done')
  if (!allDone) {
    projectLoadState.value = {
      ...projectLoadState.value,
      steps: projectLoadState.value.steps.map((step) => (step.status === 'done' ? step : { ...step, status: 'done' })),
    }
  }

  if (projectLoadFinishTimer !== null) return

  projectLoadFinishTimer = window.setTimeout(() => {
    projectLoadFinishTimer = null
    if (projectLoadState.value?.sessionId === sessionId) {
      projectLoadState.value = null
    }
    if (dismissedProjectLoadSessionId.value === sessionId) {
      dismissedProjectLoadSessionId.value = null
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
    tracks: Array.isArray(raw?.tracks)
      ? raw.tracks.map((t) => ({ trailType: 'enduro', difficulty: 'blue', ...t }) as GpxTrack)
      : [],
    symbols: Array.isArray(raw?.symbols) ? raw.symbols : [],
    customSymbols: Array.isArray(raw?.customSymbols) ? raw.customSymbols : [],
    mapSettings: {
      terrain: Number(raw?.mapSettings?.terrain ?? 1.4),
      hillshade: Number(raw?.mapSettings?.hillshade ?? 100),
      labelFont: raw?.mapSettings?.labelFont ?? 'segoe',
      showPistaTrails: raw?.mapSettings?.showPistaTrails ?? true,
      showHeatmap: raw?.mapSettings?.showHeatmap ?? false,
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
    saveStatusMessage.value = 'Sauvegarde en cours.'

    const snapshot = createProjectSnapshot()
    const id = await saveUserProject(
      currentProjectId.value,
      snapshot,
      sanitizeProjectName(projectName.value),
    )
    if (!id) throw new Error('save failed')

    currentProjectId.value = id
    lastSavedAt.value = snapshot.savedAt
    hasSavedProject.value = true
    saveStatus.value = 'saved'
    saveStatusMessage.value = 'Projet enregistré (cloud).'
  } catch (error) {
    console.error(error)
    saveStatus.value = 'error'
    saveStatusMessage.value = 'Sauvegarde impossible.'
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

async function refreshProjectList() {
  projects.value = await listUserProjects()
}

async function applyStoredProject(stored: import('./lib/projectsStore').StoredProject, overlayTitle = 'Reprise de ta sauvegarde') {
  hasHydratedProject.value = false
  currentProjectId.value = stored.id
  currentSpotId.value = stored.spotId
  currentSpotStatus.value = stored.spotId ? await getSpotStatus(stored.spotId) : null
  const project = normalizeProject(stored.data)
  beginProjectLoad(overlayTitle, project)
  applyProject(project)
  hasSavedProject.value = true
  lastSavedAt.value = project.savedAt
  hasHydratedProject.value = true
}

async function hydrateFromDb() {
  hasHydratedProject.value = false
  try {
    await refreshProjectList()
    const stored = await loadUserProject()
    if (!stored) {
      currentProjectId.value = null
      hasSavedProject.value = false
      saveStatus.value = 'idle'
      saveStatusMessage.value = ''
      hasHydratedProject.value = true
      hasStartedWelcome.value = true
      // Première visite (aucun projet) : on lance le tuto une fois.
      if (!hasSeenTour()) window.setTimeout(() => launchTour(), 600)
      return
    }

    await applyStoredProject(stored)
  } catch (error) {
    console.error(error)
    saveStatus.value = 'error'
    saveStatusMessage.value = 'Impossible de charger ton projet.'
    hasHydratedProject.value = true
    hasStartedWelcome.value = true
  }
}

function resetToEmpty() {
  hasHydratedProject.value = false
  currentProjectId.value = null
  currentSpotId.value = null
  currentSpotStatus.value = null
  tracks.value = []
  symbols.value = []
  customSymbols.value = []
  mapCamera.value = null
  projectName.value = 'Mon bikepark'
  hasSavedProject.value = false
  lastSavedAt.value = null
  saveStatus.value = 'idle'
  saveStatusMessage.value = ''
}

async function flushCurrentSave() {
  if (saveProjectTimer !== null) {
    window.clearTimeout(saveProjectTimer)
    saveProjectTimer = null
  }
  if (hasHydratedProject.value && currentProjectId.value) await saveProjectToBrowser()
}

async function onSelectProject(id: string) {
  if (id === currentProjectId.value) return
  await flushCurrentSave()
  const stored = await loadProjectById(id)
  if (stored) await applyStoredProject(stored, 'Chargement du projet')
}

async function onNewProject() {
  await flushCurrentSave()
  const id = await createProject('Mon bikepark')
  if (!id) return
  hasHydratedProject.value = false
  currentProjectId.value = id
  currentSpotId.value = null
  currentSpotStatus.value = null
  tracks.value = []
  symbols.value = []
  customSymbols.value = []
  mapCamera.value = null
  projectName.value = 'Mon bikepark'
  hasStartedWelcome.value = true
  selectedSymbolId.value = null
  saveStatus.value = 'saved'
  await refreshProjectList()
  hasHydratedProject.value = true
}

async function onDeleteProject(id: string) {
  const ok = await deleteUserProject(id)
  if (!ok) return
  const wasCurrent = id === currentProjectId.value
  await refreshProjectList()
  if (wasCurrent) {
    currentProjectId.value = null
    const next = projects.value[0]
    if (next) {
      const stored = await loadProjectById(next.id)
      if (stored) await applyStoredProject(stored, 'Chargement du projet')
    } else {
      await onNewProject()
    }
  }
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

// --- Dessin / édition des tracés ---------------------------------------------

function lineFeatureCollection(coords: [number, number][]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      },
    ],
  }
}

function beginNewTrack() {
  editorMode.value = 'draw'
  activeSection.value = 'track'
  mapViewRef.value?.beginDrawTrack()
}

function beginEditTrack(trackId: string) {
  const track = tracks.value.find((t) => t.id === trackId)
  if (!track) return
  editorMode.value = 'edit'
  mapViewRef.value?.beginEditTrack(track)
}

function commitEdit() {
  mapViewRef.value?.commitEditor()
}

function cancelEdit() {
  mapViewRef.value?.cancelEditor()
}

function onTrackDrawn(payload: { coords: [number, number][] }) {
  const index = tracks.value.length
  const baseName = `Piste ${index + 1}`
  tracks.value = [
    ...tracks.value,
    {
      id: uid(),
      name: baseName,
      color: predefinedColors[index % predefinedColors.length],
      width: 4,
      style: 'solid',
      label: baseName,
      visible: true,
      labelSize: 16,
      labelStyle: 'classic',
      trailType: 'enduro',
      difficulty: 'blue',
      geojson: lineFeatureCollection(payload.coords),
    },
  ]
  hasStartedWelcome.value = true
  activeSection.value = 'track'
  isSidebarOpen.value = true
}

function onTrackGeometryUpdated(payload: { trackId: string; coords: [number, number][] }) {
  tracks.value = tracks.value.map((track) =>
    track.id === payload.trackId
      ? { ...track, geojson: lineFeatureCollection(payload.coords) }
      : track,
  )
}

function onEditorClosed() {
  editorMode.value = 'idle'
  editorPointCount.value = 0
  editorCanUndo.value = false
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
    iconSize: 20,
    rotation: 0,
    flipX: false,
    flipY: false,
  }

  symbols.value.push(newSymbol)
  selectedSymbolId.value = newSymbol.id
  pendingAddSymbolType.value = null
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

function onStartMoveSymbol(symbolId: string) {
  repositionSymbolId.value = symbolId
  pendingAddSymbolType.value = null
  // Sur mobile on referme le panneau pour voir la carte.
  if (isMobileViewport()) isSidebarOpen.value = false
}

function onPickSymbol(symbolId: SymbolId) {
  pendingAddSymbolType.value = symbolId
  repositionSymbolId.value = null
  if (isMobileViewport()) isSidebarOpen.value = false
}

function onSymbolRepositioned() {
  repositionSymbolId.value = null
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
    const done = payload.total === 0 || payload.loaded >= payload.total
    updateProjectLoadStep('symbols', done ? 'done' : 'active')
    if (done) finishProjectLoad(payload.sessionId)
    return
  }
}

function onUpdateCamera(nextCamera: MapCameraState) {
  const current = mapCamera.value
  if (
    current &&
    current.center[0] === nextCamera.center[0] &&
    current.center[1] === nextCamera.center[1] &&
    current.zoom === nextCamera.zoom &&
    current.pitch === nextCamera.pitch &&
    current.bearing === nextCamera.bearing
  ) {
    return
  }

  mapCamera.value = nextCamera
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
      trailType: 'enduro',
      difficulty: 'blue',
      geojson,
    })
  }

  tracks.value = [...tracks.value, ...importedTracks]
  hasStartedWelcome.value = true
  activeSection.value = 'track'
  isSidebarOpen.value = true
  input.value = ''
}

// Charge le projet du user à la connexion ; réinitialise à la déconnexion.
watch(
  authSession,
  (s, prev) => {
    if (s && !prev) {
      void hydrateFromDb()
    } else if (!s && prev) {
      resetToEmpty()
    }
  },
  { immediate: true },
)

watch(
  [tracks, symbols, customSymbols, mapSettings, hasStartedWelcome, projectName],
  () => {
    queueProjectSave()
  },
  { deep: true },
)

// Le brouillon Pista (spot + trails) se synchronise quand les pistes ou le nom changent.
watch(
  [tracks, projectName],
  () => {
    queuePistaSync()
  },
  { deep: true },
)

// Garde le libellé du projet courant à jour dans le sélecteur quand on le renomme.
watch(projectName, (name) => {
  const p = projects.value.find((x) => x.id === currentProjectId.value)
  if (p) p.title = name
})
</script>

<style scoped>
.app {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  height: 100%;
  background: #1c1813;
}

.map-wrapper {
  position: relative;
  z-index: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
}

.track-editor-bar {
  position: absolute;
  z-index: 8;
  left: 50%;
  bottom: 24px;
  /* override de la règle globale `.map-wrapper > *` qui force 100%/100% */
  width: auto;
  height: auto;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: min(680px, calc(100% - 32px));
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.92);
  border: 1px solid rgba(220, 180, 105, 0.4);
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.5);
  backdrop-filter: blur(8px);
}

.track-editor-bar__hint {
  color: #d8ccb6;
  font-size: 13px;
  line-height: 1.4;
}

.track-editor-bar__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.track-editor-bar__btn {
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: transparent;
  color: #ece2cf;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.track-editor-bar__btn:hover {
  transform: translateY(-1px);
  background: rgba(148, 163, 184, 0.15);
}

.track-editor-bar__btn.primary {
  border-color: rgba(220, 180, 105, 0.5);
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.95), rgba(220, 180, 105, 0.95));
  color: #f7ecd4;
}

.track-editor-bar__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.track-editor-bar__modes {
  display: flex;
  flex-shrink: 0;
  border: 1px solid rgba(220, 180, 105, 0.4);
  border-radius: 10px;
  overflow: hidden;
}

.track-editor-bar__mode {
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: #d8ccb6;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.track-editor-bar__mode:hover {
  background: rgba(220, 180, 105, 0.15);
}

.track-editor-bar__mode.active {
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.95), rgba(220, 180, 105, 0.95));
  color: #2a2118;
}

@media (max-width: 960px) {
  .track-editor-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    bottom: 16px;
  }

  .track-editor-bar__actions {
    justify-content: flex-end;
  }
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
    radial-gradient(circle at top, rgba(220, 180, 105, 0.12), transparent 58%);
  color: #f7f2e7;
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
  border: 1px solid rgba(220, 180, 105, 0.26);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.9)),
    radial-gradient(circle at top, rgba(220, 180, 105, 0.14), transparent 58%);
  color: #f7f2e7;
  text-align: center;
  box-shadow:
    0 24px 60px rgba(2, 6, 23, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.app-load-state__card {
  position: relative;
  width: min(460px, 100%);
  padding: 28px;
  border: 1px solid rgba(220, 180, 105, 0.3);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.92)),
    radial-gradient(circle at top, rgba(220, 180, 105, 0.18), transparent 58%);
  color: #f7f2e7;
  box-shadow:
    0 24px 60px rgba(2, 6, 23, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.app-load-state__dismiss {
  position: absolute;
  top: 18px;
  right: 18px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #d8ccb6;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.app-load-state__dismiss:hover {
  border-color: rgba(220, 180, 105, 0.4);
  background: rgba(30, 41, 59, 0.92);
  color: #f7f2e7;
  transform: translateY(-1px);
}

.app-empty-state__eyebrow {
  margin-bottom: 10px;
  color: #e7c98a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.app-resume-state__eyebrow {
  margin-bottom: 10px;
  color: #e7c98a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.app-load-state__eyebrow {
  margin-bottom: 10px;
  color: #e7c98a;
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
  color: #d8ccb6;
  font-size: 14px;
  line-height: 1.6;
}

.app-resume-state p {
  margin: 0;
  color: #d8ccb6;
  font-size: 14px;
  line-height: 1.65;
}

.app-load-state p {
  margin: 0 0 18px;
  color: #d8ccb6;
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
  background: linear-gradient(90deg, #cda35a, #dcb469);
  box-shadow: 0 0 28px rgba(220, 180, 105, 0.4);
  transition: width 0.24s ease;
}

.app-load-state__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  color: #d8ccb6;
  font-size: 13px;
}

.app-load-state__meta strong {
  color: #f7f2e7;
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
  color: #d8ccb6;
}

.app-load-state__step.is-done {
  border-color: rgba(220, 180, 105, 0.3);
  background: rgba(15, 23, 42, 0.84);
  color: #f7ecd4;
}

.app-load-state__step.is-active {
  border-color: rgba(220, 180, 105, 0.4);
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.18), rgba(15, 23, 42, 0.84));
  color: #f7f2e7;
}

.app-load-state__step-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  min-height: 28px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.9);
  color: #e7c98a;
}

.app-load-state__step.is-done .app-load-state__step-icon {
  background: rgba(120, 90, 33, 0.28);
  color: #f0cd8a;
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
  color: #f7f2e7;
}

.app-empty-state__cta {
  margin-top: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 138px;
  padding: 12px 18px;
  border: 1px solid rgba(220, 180, 105, 0.42);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.88), rgba(220, 180, 105, 0.88));
  color: #f7ecd4;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow:
    0 16px 34px rgba(120, 90, 33, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    filter 0.16s ease;
}

.app-empty-state__cta:hover {
  transform: translateY(-1px);
  box-shadow:
    0 18px 38px rgba(120, 90, 33, 0.34),
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
  border: 1px solid rgba(220, 180, 105, 0.42);
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.88), rgba(220, 180, 105, 0.88));
  color: #f7ecd4;
  box-shadow:
    0 16px 34px rgba(120, 90, 33, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.app-resume-state__secondary {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.66);
  color: #ece2cf;
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
  color: #f7f2e7;
  transform: translateX(-50%);
  box-shadow: 0 8px 22px rgba(2, 6, 23, 0.1);
  backdrop-filter: blur(6px);
  pointer-events: none;
}

.submit-fab {
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 9;
  padding: 11px 16px;
  border-radius: 13px;
  border: 1px solid rgba(220, 180, 105, 0.5);
  background: linear-gradient(135deg, #cda35a, #dcb469);
  color: #f7ecd4;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(120, 90, 33, 0.35);
}

.submit-fab:hover {
  transform: translateY(-1px);
}

.submit-toast {
  position: absolute;
  bottom: 78px;
  left: 50%;
  z-index: 31;
  transform: translateX(-50%);
  max-width: min(520px, calc(100% - 32px));
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(5, 46, 22, 0.95);
  border: 1px solid rgba(134, 239, 172, 0.4);
  color: #bbf7d0;
  font-size: 13px;
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.5);
}

.symbol-action-bar {
  position: absolute;
  z-index: 9;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 8px 14px;
  border-radius: 14px;
  background: rgba(11, 18, 32, 0.92);
  border: 1px solid rgba(96, 165, 250, 0.35);
  box-shadow: 0 14px 32px rgba(2, 6, 23, 0.5);
  backdrop-filter: blur(8px);
}

.symbol-action-bar__label {
  font-size: 13px;
  color: #d8ccb6;
}

.symbol-action-bar__btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: transparent;
  color: #e2e8f0;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.symbol-action-bar__btn.danger {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

@media (max-width: 960px) {
  .symbol-action-bar {
    bottom: 16px;
  }

  .submit-fab {
    bottom: 16px;
    left: 16px;
  }
}

.auth-loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1c1813;
  color: #b3a890;
  font-size: 14px;
}

.account-chip {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 12;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px 5px 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  max-width: 46vw;
}

.account-chip__email {
  font-size: 12px;
  color: #d8ccb6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-chip__logout {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: transparent;
  color: #ece2cf;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.account-chip__logout:hover {
  background: rgba(148, 163, 184, 0.15);
}

@media (max-width: 960px) {
  .account-chip__email {
    display: none;
  }
  .account-chip {
    top: 14px;
    right: 14px;
  }
}

.app-floating-brand__name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgba(248, 250, 252, 0.96);
}

.symbol-drag-preview {
  --preview-color: #dcb469;
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
  color: #25211a;
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
