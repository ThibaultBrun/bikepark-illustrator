<template>
  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="mountain" />
      </div>
      <div class="panel-header-copy">
        <h2>{{ t('map.relief') }}</h2>
        <p>{{ t('map.reliefDesc') }}</p>
      </div>
    </div>

    <label class="slider-field">
      <div class="slider-label-row">
        <span>{{ t('map.intensity') }}</span>
        <strong>{{ settings.terrain.toFixed(1) }}</strong>
      </div>
      <input
        :value="settings.terrain"
        type="range"
        min="0"
        max="5"
        step="0.1"
        @input="updateTerrain"
      />
    </label>
  </section>

  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="blend" />
      </div>
      <div class="panel-header-copy">
        <h2>{{ t('map.shade') }}</h2>
        <p>{{ t('map.shadeDesc') }}</p>
      </div>
    </div>

    <label class="slider-field">
      <div class="slider-label-row">
        <span>Opacite</span>
        <strong>{{ Math.round(settings.hillshade) }}%</strong>
      </div>
      <input
        :value="settings.hillshade"
        type="range"
        min="0"
        max="100"
        step="1"
        @input="updateHillshade"
      />
    </label>
  </section>

  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="symbol" />
      </div>
      <div class="panel-header-copy">
        <h2>{{ t('map.font') }}</h2>
        <p>{{ t('map.fontDesc') }}</p>
      </div>
    </div>

    <div class="font-dropdown">
      <button
        type="button"
        class="font-dropdown-trigger"
        :aria-expanded="isFontMenuOpen"
        @click="toggleFontMenu"
      >
        <span class="font-dropdown-trigger-copy">
          <span class="font-dropdown-trigger-kicker">Police active</span>
          <span
            class="font-dropdown-trigger-label"
            :style="{ fontFamily: selectedFontOption.previewFamily }"
          >
            {{ selectedFontOption.label }}
          </span>
        </span>

        <span class="font-dropdown-trigger-caret" :class="{ open: isFontMenuOpen }"></span>
      </button>

      <div v-if="isFontMenuOpen" class="font-dropdown-menu">
        <div class="font-dropdown-menu-header">Choisis une police globale</div>

        <button
          v-for="option in mapLabelFontOptions"
          :key="option.value"
          type="button"
          class="font-option"
          :class="{ active: settings.labelFont === option.value }"
          @click="selectFont(option.value)"
        >
          <span class="font-option-preview" :style="{ fontFamily: option.previewFamily }">Aa</span>

          <span class="font-option-copy">
            <span class="font-option-name" :style="{ fontFamily: option.previewFamily }">
              {{ option.label }}
            </span>
            <span class="font-option-meta">Label global</span>
          </span>

          <span v-if="settings.labelFont === option.value" class="font-option-check">Actif</span>
        </button>
      </div>
    </div>
  </section>

  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="track" />
      </div>
      <div class="panel-header-copy">
        <h2>{{ t('map.pistaTitle') }}</h2>
        <p>{{ t('map.pistaDesc') }}</p>
      </div>
    </div>

    <label class="toggle-row">
      <input
        type="checkbox"
        :checked="settings.showPistaTrails"
        @change="updateShowPistaTrails"
      />
      <span>{{ t('map.showPista') }}</span>
    </label>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mapLabelFontOptions, type MapLabelFont, type MapSettings } from './map-settings'
import SidebarIcon from './SidebarIcon.vue'

const { t } = useI18n()

const props = defineProps<{
  settings: MapSettings
}>()

const emit = defineEmits<{
  (e: 'update:settings', value: MapSettings): void
}>()

const isFontMenuOpen = ref(false)

const selectedFontOption = computed(() => {
  return (
    mapLabelFontOptions.find((option) => option.value === props.settings.labelFont) ??
    mapLabelFontOptions[0]
  )
})

function updateTerrain(event: Event) {
  emit('update:settings', {
    ...props.settings,
    terrain: Number((event.target as HTMLInputElement).value),
  })
}

function updateHillshade(event: Event) {
  emit('update:settings', {
    ...props.settings,
    hillshade: Number((event.target as HTMLInputElement).value),
  })
}

function updateShowPistaTrails(event: Event) {
  emit('update:settings', {
    ...props.settings,
    showPistaTrails: (event.target as HTMLInputElement).checked,
  })
}

function toggleFontMenu() {
  isFontMenuOpen.value = !isFontMenuOpen.value
}

function selectFont(labelFont: MapLabelFont) {
  emit('update:settings', {
    ...props.settings,
    labelFont,
  })
  isFontMenuOpen.value = false
}
</script>

<style scoped>
.panel {
  margin-bottom: 16px;
  padding: 14px;
  background: #2d2820;
  border: 1px solid #38322a;
  border-radius: 16px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.panel-header-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-header-copy h2 {
  margin: 0;
  font-size: 14px;
  color: #d8ccb6;
}

.panel-header-copy p {
  margin: 0;
  color: #b3a890;
  line-height: 1.5;
  font-size: 13px;
}

.placeholder-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(205, 163, 90, 0.18);
  border: 1px solid rgba(220, 180, 105, 0.28);
  color: #f0cd8a;
}

.slider-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slider-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #d8ccb6;
  font-size: 12px;
  font-weight: 700;
}

.slider-label-row strong {
  color: #f7ecd4;
}

.slider-field input[type='range'] {
  width: 100%;
  accent-color: #dcb469;
  cursor: pointer;
}

.font-dropdown {
  position: relative;
  margin-top: 2px;
}

.font-dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 11px 13px;
  border: 1px solid rgba(51, 65, 85, 0.95);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98)),
    radial-gradient(circle at top, rgba(220, 180, 105, 0.08), transparent 60%);
  color: #f7ecd4;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.font-dropdown-trigger:hover {
  transform: translateY(-1px);
  border-color: rgba(220, 180, 105, 0.4);
  box-shadow:
    0 12px 28px rgba(2, 6, 23, 0.22),
    0 0 0 1px rgba(220, 180, 105, 0.08);
}

.font-dropdown-trigger-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.font-dropdown-trigger-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.font-dropdown-trigger-label {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
  color: #f7f2e7;
}

.font-dropdown-trigger-caret {
  width: 10px;
  height: 10px;
  border-right: 2px solid #e7c98a;
  border-bottom: 2px solid #e7c98a;
  transform: rotate(45deg) translateY(-1px);
  transition: transform 0.18s ease;
}

.font-dropdown-trigger-caret.open {
  transform: rotate(-135deg) translateY(-1px);
}

.font-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 340px;
  padding: 10px;
  overflow-y: auto;
  border: 1px solid rgba(51, 65, 85, 0.92);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.99), rgba(15, 23, 42, 0.98)),
    radial-gradient(circle at top, rgba(220, 180, 105, 0.07), transparent 62%);
  box-shadow:
    0 20px 42px rgba(2, 6, 23, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.font-dropdown-menu-header {
  padding: 2px 4px 0;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.font-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 10px 11px;
  border: 1px solid rgba(30, 41, 59, 0.92);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.78);
  color: #ece2cf;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.font-option:hover {
  transform: translateY(-1px);
  border-color: rgba(220, 180, 105, 0.32);
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.14);
}

.font-option.active {
  border-color: rgba(220, 180, 105, 0.78);
  background: linear-gradient(180deg, rgba(120, 90, 33, 0.3), rgba(15, 23, 42, 0.92));
  box-shadow:
    0 0 0 1px rgba(240, 205, 138, 0.14),
    0 10px 24px rgba(2, 6, 23, 0.16);
}

.font-option-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  flex: 0 0 auto;
  background: rgba(255, 255, 255, 0.06);
  color: #f7f2e7;
  font-size: 17px;
  font-weight: 700;
}

.font-option-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.font-option-name {
  display: block;
  line-height: 1.15;
  overflow-wrap: anywhere;
  font-size: 15px;
  font-weight: 700;
}

.font-option-meta {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}

.font-option-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(220, 180, 105, 0.18);
  color: #bfdbfe;
  font-size: 9px;
  font-weight: 700;
  flex: 0 0 auto;
  align-self: center;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #d8ccb6;
  cursor: pointer;
}

.toggle-row input {
  width: 18px;
  height: 18px;
  accent-color: #cda35a;
  cursor: pointer;
}
</style>
