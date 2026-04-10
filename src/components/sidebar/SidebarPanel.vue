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
        @gpx-files="$emit('gpx-files', $event)"
        @fit-project="$emit('fit-project')"
        @fit-track="$emit('fit-track', $event)"
        @remove-track="$emit('remove-track', $event)"
        @track-width-change="$emit('track-width-change', $event)"
        @update:project-name="$emit('update:project-name', $event)"
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
      />
      <MapPanel
        v-else-if="activeSection === 'map'"
        :settings="mapSettings"
        @update:settings="$emit('update:map-settings', $event)"
      />
      <ExportPanel
        v-else
        @export-zip="$emit('export-zip')"
        @import-zip="$emit('import-zip', $event)"
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
}>()

defineEmits<{
  (e: 'toggle'): void
  (e: 'close'): void
  (e: 'open-section', sectionId: SidebarSectionId): void
  (e: 'gpx-files', event: Event): void
  (e: 'fit-project'): void
  (e: 'fit-track', trackId: string): void
  (e: 'remove-track', trackId: string): void
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
  (e: 'track-width-change', track: GpxTrack): void
  (e: 'update:map-settings', value: MapSettings): void
  (e: 'export-zip'): void
  (e: 'import-zip', file: File): void
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
  background: #020817;
  border-right: 1px solid rgba(30, 41, 59, 0.9);
  box-shadow: inset -1px 0 0 rgba(15, 23, 42, 0.45);
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
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  color: #cbd5e1;
  font: inherit;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 16px 40px rgba(2, 6, 23, 0.2);
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.rail-toggle:hover,
.rail-nav-button:hover {
  background: rgba(30, 41, 59, 0.96);
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.35);
}

.rail-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rail-nav-button.active {
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.35), rgba(30, 64, 175, 0.35));
  border-color: rgba(96, 165, 250, 0.5);
  color: #eff6ff;
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
  background: #0f172a;
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
  color: #94a3b8;
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
    color: #cbd5e1;
    font: inherit;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .mobile-section-button.active {
    background: linear-gradient(180deg, rgba(37, 99, 235, 0.32), rgba(30, 64, 175, 0.3));
    border-color: rgba(96, 165, 250, 0.55);
    color: #eff6ff;
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
