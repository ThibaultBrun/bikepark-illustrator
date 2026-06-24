<template>
  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="export" />
      </div>

      <div class="panel-header-copy">
        <h2>{{ t('exportPanel.title') }}</h2>
        <p>{{ t('exportPanel.desc') }}</p>
      </div>
    </div>

    <div class="block">
      <div class="block-title">{{ t('exportPanel.visibilityTitle') }}</div>

      <div class="spot-meta">
        <label class="field-mini">
          <span>{{ t('exportPanel.spotTypeLabel') }}</span>
          <select
            :value="spotType"
            @change="$emit('update:spot-type', ($event.target as HTMLSelectElement).value as any)"
          >
            <option v-for="o in spotTypes" :key="o" :value="o">{{ t('spotType.' + o) }}</option>
          </select>
        </label>
        <label class="field-mini">
          <span>{{ t('exportPanel.regionLabel') }}</span>
          <input
            :value="spotRegion"
            type="text"
            :placeholder="t('exportPanel.regionPh')"
            @input="$emit('update:spot-region', ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>

      <div class="visibility-seg">
        <button
          type="button"
          :class="{ active: level === 'private' }"
          @click="$emit('set-visibility', 'private')"
        >
          🔒 {{ t('exportPanel.visPrivate') }}
        </button>
        <button
          type="button"
          :class="{ active: level === 'unlisted' }"
          @click="$emit('set-visibility', 'unlisted')"
        >
          🔗 {{ t('exportPanel.visUnlisted') }}
        </button>
        <button
          type="button"
          :class="{ active: level === 'public' }"
          @click="$emit('set-visibility', 'public')"
        >
          🌍 {{ t('exportPanel.visPublic') }}
        </button>
      </div>

      <p class="hint" :class="{ 'status--pending': spotStatus === 'submitted', 'status--ok': spotStatus === 'published' }">
        {{ visibilityHint }}
      </p>

      <button
        v-if="spotStatus === 'unlisted' || spotStatus === 'published'"
        type="button"
        class="action-button"
        @click="$emit('copy-link')"
      >
        🔗 {{ t('exportPanel.copyLink') }}
      </button>

      <button
        v-if="canPreview"
        type="button"
        class="action-button"
        @click="$emit('preview-in-pista')"
      >
        {{ t('exportPanel.previewPista') }}
      </button>
    </div>

    <div class="block">
      <div class="block-title">{{ t('exportPanel.contribTitle') }}</div>
      <p v-if="preselectedSpot" class="contrib-target">
        {{ t('exportPanel.contribTarget', { spot: preselectedSpot.name }) }}
      </p>
      <p class="hint">{{ t('exportPanel.contribHint') }}</p>
      <input
        v-model="spotQuery"
        type="text"
        class="contrib-input"
        :placeholder="t('exportPanel.contribSearch')"
        @input="onSearch"
      />
      <ul v-if="spotResults.length" class="spot-results">
        <li v-for="sp in spotResults" :key="sp.id">
          <button
            type="button"
            class="spot-result"
            :class="{ active: selectedSpot?.id === sp.id }"
            @click="selectSpot(sp)"
          >
            {{ sp.name }}<small v-if="sp.region"> · {{ sp.region }}</small>
          </button>
        </li>
      </ul>
      <button
        v-if="selectedSpot"
        type="button"
        class="action-button primary"
        :disabled="trackCount === 0"
        @click="onPropose"
      >
        {{ t('exportPanel.contribSend', { n: trackCount, spot: selectedSpot.name }) }}
      </button>
    </div>

    <div class="block">
      <div class="block-title">{{ t('exportPanel.localTitle') }}</div>
      <div class="action-grid">
        <button type="button" class="action-button" @click="$emit('export-zip')">
          {{ t('exportPanel.exportZip') }}
        </button>
        <label class="action-button import-button">
          <span>{{ t('exportPanel.importZip') }}</span>
          <input type="file" accept=".zip" @change="onZipSelected" />
        </label>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SidebarIcon from './SidebarIcon.vue'
import { searchPublishedSpots, type PublicSpot } from '../../lib/projectsStore'

const { t } = useI18n()

type SpotType = 'bikepark' | 'zone_enduro' | 'secteur' | 'skills_park'
const spotTypes: readonly SpotType[] = ['bikepark', 'zone_enduro', 'secteur', 'skills_park']

const props = defineProps<{
  spotStatus: 'draft' | 'unlisted' | 'submitted' | 'published' | 'archived' | null
  canPreview?: boolean
  preselectedSpot?: { id: string; name: string } | null
  spotRegion?: string
  spotType?: SpotType
  trackCount: number
}>()

const emit = defineEmits<{
  (e: 'export-zip'): void
  (e: 'import-zip', file: File): void
  (e: 'request-publication'): void
  (e: 'cancel-publication'): void
  (e: 'propose-to-spot', payload: { id: string; name: string }): void
  (e: 'preview-in-pista'): void
  (e: 'set-visibility', level: 'private' | 'unlisted' | 'public'): void
  (e: 'copy-link'): void
  (e: 'update:spot-region', value: string): void
  (e: 'update:spot-type', value: SpotType): void
}>()

// Niveau de visibilité courant déduit du statut du spot.
const level = computed<'private' | 'unlisted' | 'public'>(() => {
  switch (props.spotStatus) {
    case 'unlisted':
      return 'unlisted'
    case 'submitted':
    case 'published':
      return 'public'
    default:
      return 'private' // draft / null
  }
})
const visibilityHint = computed(() => {
  switch (props.spotStatus) {
    case 'unlisted':
      return t('exportPanel.visHintUnlisted')
    case 'submitted':
      return t('exportPanel.visHintPending')
    case 'published':
      return t('exportPanel.visHintPublic')
    case 'draft':
      return t('exportPanel.visHintPrivate')
    default:
      return t('exportPanel.pubHintNew') // spot pas encore créé
  }
})

const spotQuery = ref('')
const spotResults = ref<PublicSpot[]>([])
const selectedSpot = ref<PublicSpot | null>(null)
let searchTimer: number | null = null

// Pré-sélection via deep-link « Créer ma piste » depuis Pista (?spot=…).
watch(
  () => props.preselectedSpot,
  (sp) => {
    if (sp?.id) {
      selectedSpot.value = { id: sp.id, name: sp.name, region: null }
      spotQuery.value = sp.name
    }
  },
  { immediate: true },
)

function onSearch() {
  selectedSpot.value = null
  if (searchTimer !== null) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(async () => {
    spotResults.value = await searchPublishedSpots(spotQuery.value)
  }, 300)
}

function selectSpot(sp: PublicSpot) {
  selectedSpot.value = sp
  spotResults.value = []
  spotQuery.value = sp.name
}

function onPropose() {
  if (!selectedSpot.value) return
  emit('propose-to-spot', { id: selectedSpot.value.id, name: selectedSpot.value.name })
  selectedSpot.value = null
  spotQuery.value = ''
}

function onZipSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  emit('import-zip', file)
  input.value = ''
}
</script>

<style scoped>
.visibility-seg {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.visibility-seg button {
  flex: 1;
  padding: 8px 6px;
  border-radius: 10px;
  border: 1px solid #38322a;
  background: transparent;
  color: #b3a890;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.visibility-seg button:hover {
  background: rgba(220, 180, 105, 0.12);
}
.visibility-seg button.active {
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.95), rgba(220, 180, 105, 0.95));
  border-color: rgba(220, 180, 105, 0.5);
  color: #2a2118;
}
.spot-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 4px 0 8px;
}
.field-mini {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: #b3a890;
}
.field-mini select,
.field-mini input {
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid #4a4234;
  background: #1c1813;
  color: #ece2cf;
  font: inherit;
  font-size: 13px;
}
.field-mini select:focus,
.field-mini input:focus {
  outline: none;
  border-color: #dcb469;
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-title {
  font-size: 13px;
  font-weight: 800;
  color: #d8ccb6;
}

.hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: #b3a890;
}

.hint strong {
  color: #f0cd8a;
}

.contrib-target {
  margin: 0 0 6px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(220, 180, 105, 0.4);
  background: rgba(220, 180, 105, 0.12);
  color: #f0cd8a;
  font-size: 12px;
  line-height: 1.45;
  font-weight: 600;
}

.status {
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12.5px;
}

.status--pending {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fcd34d;
}

.status--ok {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.action-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba(51, 65, 85, 0.95);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.96));
  color: #ece2cf;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.action-button:hover {
  transform: translateY(-1px);
  border-color: rgba(220, 180, 105, 0.4);
  box-shadow: 0 12px 28px rgba(2, 6, 23, 0.22);
}

.action-button.primary {
  border-color: rgba(220, 180, 105, 0.42);
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.9), rgba(220, 180, 105, 0.9));
  color: #f7ecd4;
}

.import-button {
  position: relative;
  overflow: hidden;
}

.import-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.contrib-input {
  width: 100%;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid #4a4234;
  background: #1c1813;
  color: #ece2cf;
  font: inherit;
  font-size: 13px;
}

.contrib-input:focus {
  outline: none;
  border-color: #dcb469;
}

.spot-results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spot-result {
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(28, 24, 19, 0.6);
  color: #e2e8f0;
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
}

.spot-result:hover,
.spot-result.active {
  border-color: rgba(220, 180, 105, 0.4);
}

.spot-result small {
  color: #b3a890;
}
</style>
