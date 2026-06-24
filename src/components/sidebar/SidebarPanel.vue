<template>
  <div class="sidebar-shell">
    <button
      v-if="isOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="Fermer le panneau"
      @click="$emit('close')"
    />

    <div class="desktop-rail">
      <div class="rail-stack">
        <button
          type="button"
          class="rail-toggle"
          data-tour="menu"
          :class="{ open: isOpen }"
          :aria-expanded="isOpen"
          :aria-controls="'app-sidebar'"
          @click="$emit('toggle')"
        >
          <span class="burger-icon" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <nav class="rail-nav" aria-label="Outils">
          <button
            v-for="section in sections"
            :key="section.id"
            type="button"
            class="rail-nav-button"
            :data-tour="`tool-${section.id}`"
            :class="{ active: activeSection === section.id }"
            :title="section.title"
            :aria-label="section.title"
            :aria-pressed="activeSection === section.id"
            @click="$emit('open-section', section.id)"
          >
            <SidebarIcon class="rail-nav-icon" :name="section.id" />
          </button>
        </nav>
      </div>
    </div>

    <aside id="app-sidebar" class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-header">
        <h1>{{ activeSectionMeta.title }}</h1>
        <p class="subtitle">{{ activeSectionMeta.description }}</p>
      </div>

      <nav class="mobile-section-nav" aria-label="Sections mobiles">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="mobile-section-button"
          :data-tour="`m-tool-${section.id}`"
          :class="{ active: activeSection === section.id }"
          :aria-pressed="activeSection === section.id"
          @click="$emit('open-section', section.id)"
        >
          <SidebarIcon class="mobile-section-icon" :name="section.id" />
          <span class="mobile-section-label">{{ section.title }}</span>
        </button>
      </nav>

      <TrackPanel
        v-if="activeSection === 'track'"
        :tracks="tracks"
        :predefined-colors="predefinedColors"
        :project-name="projectName"
        :projects="projects"
        :current-project-id="currentProjectId"
        @gpx-files="$emit('gpx-files', $event)"
        @fit-project="$emit('fit-project')"
        @fit-track="$emit('fit-track', $event)"
        @remove-track="$emit('remove-track', $event)"
        @new-track="$emit('new-track')"
        @edit-track="$emit('edit-track', $event)"
        @track-width-change="$emit('track-width-change', $event)"
        @update:project-name="$emit('update:project-name', $event)"
        @select-project="$emit('select-project', $event)"
        @new-project="$emit('new-project')"
        @delete-project="$emit('delete-project', $event)"
      />

      <SymbolPanel
        v-else-if="activeSection === 'symbol'"
        :custom-symbols="customSymbols"
        :placed-symbols="symbols ?? []"
        :selected-symbol-id="selectedSymbolId"
        @start-symbol-drag="$emit('start-symbol-drag', $event)"
        @upload-svg="$emit('upload-svg', $event)"
        @update-symbol-size="$emit('update-symbol-size', $event)"
        @update-symbol-transform="$emit('update-symbol-transform', $event)"
        @remove-symbol="$emit('remove-symbol', $event)"
        @start-move-symbol="$emit('start-move-symbol', $event)"
        @pick-symbol="$emit('pick-symbol', $event)"
      />
      <MapPanel
        v-else-if="activeSection === 'map'"
        :settings="mapSettings"
        :is-admin="isAdmin"
        @update:settings="$emit('update:map-settings', $event)"
      />
      <ExportPanel
        v-else-if="activeSection === 'export'"
        :spot-status="spotStatus"
        :can-preview="canPreview"
        :preselected-spot="preselectedSpot"
        :spot-region="spotRegion"
        :spot-type="spotType"
        :track-count="tracks.length"
        @update:spot-region="$emit('update:spot-region', $event)"
        @update:spot-type="$emit('update:spot-type', $event)"
        @export-zip="$emit('export-zip')"
        @import-zip="$emit('import-zip', $event)"
        @request-publication="$emit('request-publication')"
        @cancel-publication="$emit('cancel-publication')"
        @propose-to-spot="$emit('propose-to-spot', $event)"
        @preview-in-pista="$emit('preview-in-pista')"
        @set-visibility="$emit('set-visibility', $event)"
        @copy-link="$emit('copy-link')"
      />
      <LocatePanel
        v-else-if="activeSection === 'locate'"
        @locate="$emit('locate', $event)"
      />
      <PrintPanel
        v-else-if="activeSection === 'print'"
        @export-image="$emit('export-image')"
      />
      <HelpPanel
        v-else
        @start-tour="$emit('start-tour')"
      />
    </aside>

    <button
      type="button"
      class="mobile-drawer-handle"
      :aria-expanded="isOpen"
      :aria-controls="'app-sidebar'"
      @click="$emit('toggle')"
    >
      <span class="mobile-drawer-pill" aria-hidden="true"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GpxTrack } from '../../types/gpx'
import type { MapSymbol, SymbolDefinition } from '../../types/symbol'
import ExportPanel from './ExportPanel.vue'
import LocatePanel from './LocatePanel.vue'
import PrintPanel from './PrintPanel.vue'
import HelpPanel from './HelpPanel.vue'
import MapPanel from './MapPanel.vue'
import type { MapSettings } from './map-settings'
import SidebarIcon from './SidebarIcon.vue'
import SymbolPanel from './SymbolPanel.vue'
import TrackPanel from './TrackPanel.vue'
import type { SidebarSection, SidebarSectionId } from './types'

const props = defineProps<{
  isOpen: boolean
  activeSection: SidebarSectionId
  sections: SidebarSection[]
  tracks: GpxTrack[]
  symbols?: MapSymbol[]
  customSymbols: SymbolDefinition[]
  selectedSymbolId: string | null
  predefinedColors: string[]
  mapSettings: MapSettings
  projectName: string
  spotStatus: 'draft' | 'unlisted' | 'submitted' | 'published' | 'archived' | null
  canPreview?: boolean
  preselectedSpot?: { id: string; name: string } | null
  spotRegion?: string
  spotType?: 'bikepark' | 'zone_enduro' | 'secteur' | 'skills_park'
  projects: { id: string; title: string | null; spotId: string | null }[]
  currentProjectId: string | null
  isAdmin: boolean
}>()

defineEmits<{
  (e: 'toggle'): void
  (e: 'close'): void
  (e: 'open-section', sectionId: SidebarSectionId): void
  (e: 'gpx-files', event: Event): void
  (e: 'fit-project'): void
  (e: 'fit-track', trackId: string): void
  (e: 'remove-track', trackId: string): void
  (e: 'new-track'): void
  (e: 'edit-track', trackId: string): void
  (e: 'submit-project'): void
  (e: 'request-publication'): void
  (e: 'cancel-publication'): void
  (e: 'propose-to-spot', payload: { id: string; name: string }): void
  (e: 'preview-in-pista'): void
  (e: 'export-image'): void
  (e: 'update:spot-region', value: string): void
  (e: 'update:spot-type', value: 'bikepark' | 'zone_enduro' | 'secteur' | 'skills_park'): void
  (e: 'set-visibility', level: 'private' | 'unlisted' | 'public'): void
  (e: 'copy-link'): void
  (e: 'locate', payload: { lng: number; lat: number; label: string }): void
  (e: 'select-project', id: string): void
  (e: 'new-project'): void
  (e: 'delete-project', id: string): void
  (e: 'update:project-name', value: string): void
  (e: 'start-symbol-drag', payload: {
    symbolId: import('../../types/symbol').SymbolId
    clientX: number
    clientY: number
  }): void
  (e: 'upload-svg', payload: import('../../types/symbol').UploadedSymbolPayload): void
  (e: 'update-symbol-size', payload: { symbolId: string; iconSize: number }): void
  (e: 'update-symbol-transform', payload: {
    symbolId: string
    rotation?: number
    flipX?: boolean
    flipY?: boolean
  }): void
  (e: 'remove-symbol', payload: { symbolId: string }): void
  (e: 'start-move-symbol', symbolId: string): void
  (e: 'pick-symbol', symbolId: import('../../types/symbol').SymbolId): void
  (e: 'track-width-change', track: GpxTrack): void
  (e: 'update:map-settings', value: MapSettings): void
  (e: 'export-zip'): void
  (e: 'import-zip', file: File): void
  (e: 'start-tour'): void
}>()

const activeSectionMeta = computed(() => {
  return props.sections.find((section) => section.id === props.activeSection) ?? props.sections[0]
})
</script>

<style scoped>
.sidebar-shell {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.desktop-rail {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 35;
  width: 64px;
  pointer-events: none;
  /* Même look que le header de pista.bike : taupe translucide + flou. */
  background: rgba(47, 42, 34, 0.72);
  border-right: 1px solid rgba(179, 168, 144, 0.12);
  backdrop-filter: blur(12px);
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.18);
}

.rail-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-top: 18px;
}

.rail-toggle,
.rail-nav-button,
.sidebar,
.sidebar-backdrop,
.mobile-drawer-handle {
  pointer-events: auto;
}

.rail-toggle,
.rail-nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(179, 168, 144, 0.16);
  border-radius: 14px;
  background: rgba(28, 24, 19, 0.55);
  color: #d8ccb6;
  font: inherit;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.rail-toggle:hover,
.rail-nav-button:hover {
  background: rgba(28, 24, 19, 0.85);
  transform: translateY(-1px);
  border-color: rgba(220, 180, 105, 0.35);
}

.rail-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rail-nav-button.active {
  background: linear-gradient(180deg, rgba(205, 163, 90, 0.35), rgba(120, 90, 33, 0.35));
  border-color: rgba(220, 180, 105, 0.5);
  color: #f7ecd4;
}

.rail-nav-icon {
  width: 18px;
  height: 18px;
}

.burger-icon {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  width: 18px;
}

.burger-icon span {
  display: block;
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  transform-origin: center;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.rail-toggle.open .burger-icon span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.rail-toggle.open .burger-icon span:nth-child(2) {
  opacity: 0;
}

.rail-toggle.open .burger-icon span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.sidebar-backdrop {
  position: absolute;
  inset: 0;
  z-index: 20;
  border: 0;
  padding: 0;
  background: rgba(2, 6, 23, 0.42);
  cursor: pointer;
}

.sidebar {
  position: absolute;
  top: 0;
  left: 64px;
  z-index: 30;
  width: min(360px, calc(100vw - 24px));
  max-width: 100%;
  height: 100%;
  padding: 18px;
  background: #25211a;
  color: #e5e7eb;
  overflow-y: auto;
  box-shadow: 14px 0 40px rgba(2, 6, 23, 0.45);
  transform: translateX(calc(-100% - 64px));
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  position: sticky;
  top: -18px;
  z-index: 2;
  margin-bottom: 18px;
  margin-left: -18px;
  margin-right: -18px;
  padding: 18px 18px 14px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.92));
  backdrop-filter: blur(12px);
}

.sidebar h1 {
  margin: 0 0 4px;
  font-size: 20px;
  line-height: 1.1;
}

.subtitle {
  margin: 0;
  color: #b3a890;
  font-size: 13px;
}

.mobile-section-nav {
  display: none;
}

.mobile-drawer-handle {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 40;
  display: none;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.92);
  color: #e5e7eb;
  padding: 10px 18px;
  border-radius: 999px;
  font: inherit;
  cursor: pointer;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.35);
}

.mobile-drawer-pill {
  display: inline-block;
  width: 34px;
  height: 4px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.9);
}

@media (min-width: 961px) {
  .sidebar {
    width: 360px;
    border-right: 1px solid rgba(30, 41, 59, 0.9);
  }

  .sidebar-backdrop {
    display: none;
  }

  .mobile-drawer-handle {
    display: none;
  }
}

@media (max-width: 960px) {
  .desktop-rail {
    display: none;
  }

  .sidebar {
    top: auto;
    left: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    height: min(78vh, 720px);
    padding: 14px 14px calc(18px + env(safe-area-inset-bottom));
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(18px);
    box-shadow: 0 -20px 50px rgba(2, 6, 23, 0.5);
    transform: translateY(100%);
  }

  .sidebar.open {
    transform: translateY(0);
  }

  .mobile-drawer-handle {
    display: inline-flex;
    bottom: calc(14px + env(safe-area-inset-bottom));
  }

  .sidebar-backdrop {
    background: rgba(2, 6, 23, 0.32);
  }

  .sidebar-header {
    top: -14px;
    margin-left: -14px;
    margin-right: -14px;
    margin-bottom: 12px;
    padding: 14px 14px 10px;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.68));
  }

  .mobile-section-nav {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 14px;
    position: sticky;
    top: 62px;
    z-index: 2;
    padding-bottom: 4px;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.62));
    backdrop-filter: blur(10px);
  }

  .mobile-section-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 6px;
    border: 1px solid rgba(30, 41, 59, 0.9);
    border-radius: 14px;
    background: rgba(17, 24, 39, 0.9);
    color: #d8ccb6;
    font: inherit;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .mobile-section-button.active {
    background: linear-gradient(180deg, rgba(205, 163, 90, 0.32), rgba(120, 90, 33, 0.3));
    border-color: rgba(220, 180, 105, 0.55);
    color: #f7ecd4;
  }

  .mobile-section-icon {
    width: 18px;
    height: 18px;
  }

  .mobile-section-label {
    line-height: 1;
  }
}
</style>
