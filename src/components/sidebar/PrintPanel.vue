<template>
  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="print" />
      </div>
      <div class="panel-header-copy">
        <h2>{{ t('print.title') }}</h2>
        <p>{{ t('print.desc') }}</p>
      </div>
    </div>

    <p class="hint">{{ t('print.hint') }}</p>

    <!-- Format picker -->
    <div class="fmt-label">{{ t('print.format') }}</div>
    <div class="fmt-grid">
      <button
        v-for="fmt in PRINT_FORMATS"
        :key="fmt.id"
        type="button"
        class="fmt-btn"
        :class="{ active: selectedFormat === fmt.id }"
        @click="selectedFormat = fmt.id"
        :title="`${fmt.label} ${fmt.sublabel}`"
      >
        <span class="fmt-icon">{{ fmt.icon }}</span>
        <span class="fmt-name">{{ fmt.label }}</span>
        <span class="fmt-sub">{{ fmt.sublabel }}</span>
      </button>
    </div>

    <!-- Branding section -->
    <div class="branding-section">
      <div class="section-label">{{ t('print.branding') }}</div>

      <div class="branding-fields">
        <div class="field-row">
          <label class="field-label">{{ t('print.brandingParkName') }}</label>
          <input
            v-model="localPosterName"
            type="text"
            class="text-input"
            :placeholder="defaultParkName || 'Mon Bikepark'"
          />
        </div>

        <div class="field-row">
          <label class="field-label">{{ t('print.brandingRegion') }}</label>
          <input
            v-model="localRegion"
            type="text"
            class="text-input"
            :placeholder="defaultRegion"
          />
        </div>

        <div class="field-row field-row--inline">
          <label class="field-label">{{ t('print.brandingAccent') }}</label>
          <div class="color-picker-wrap">
            <input
              v-model="localAccentColor"
              type="color"
              class="color-input"
            />
            <span class="color-hex">{{ localAccentColor }}</span>
          </div>
        </div>

        <div class="field-row">
          <label class="field-label">{{ t('print.brandingLogo') }}</label>
          <div class="logo-wrap">
            <div v-if="localLogoDataUrl" class="logo-preview">
              <img :src="localLogoDataUrl" alt="logo" class="logo-img" />
              <div class="logo-actions">
                <button type="button" class="logo-btn" @click="triggerLogoUpload">{{ t('print.brandingLogoChange') }}</button>
                <button type="button" class="logo-btn logo-btn--remove" @click="localLogoDataUrl = ''">{{ t('print.brandingLogoRemove') }}</button>
              </div>
            </div>
            <button v-else type="button" class="action-button logo-upload-btn" @click="triggerLogoUpload">
              🖼 {{ t('print.brandingLogoUpload') }}
            </button>
            <input
              ref="logoInputRef"
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              class="file-input-hidden"
              @change="onLogoFileChange"
            />
          </div>
        </div>
      </div>
    </div>

    <button type="button" class="action-button primary" @click="onExportPoster">
      🎨 {{ t('print.exportPoster') }}
    </button>

    <button type="button" class="action-button publish-btn" @click="onPublishPoster">
      🌐 {{ t('print.publishPoster') }}
    </button>

    <button type="button" class="action-button" @click="onExportPdf">
      📄 {{ t('print.exportPdf') }}
    </button>

    <button type="button" class="action-button" @click="$emit('export-image')">
      {{ t('print.exportPng') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SidebarIcon from './SidebarIcon.vue'
import { PRINT_FORMATS, type PrintFormatId } from '../../lib/printFormats'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  defaultParkName?: string
  defaultRegion?: string
}>(), {
  defaultParkName: '',
  defaultRegion: '',
})

const emit = defineEmits<{
  (e: 'export-image'): void
  (e: 'export-poster', formatId: PrintFormatId, branding: { posterName: string; region: string; accentColor: string; logoDataUrl: string }): void
  (e: 'export-pdf', formatId: PrintFormatId, branding: { posterName: string; region: string; accentColor: string; logoDataUrl: string }): void
  (e: 'publish-poster', formatId: PrintFormatId, branding: { posterName: string; region: string; accentColor: string; logoDataUrl: string }): void
}>()

const selectedFormat = ref<PrintFormatId>('a4p')

const localPosterName = ref(props.defaultParkName || '')
const localRegion = ref(props.defaultRegion || '')
const localAccentColor = ref('#c8a050')
const localLogoDataUrl = ref('')
const logoInputRef = ref<HTMLInputElement | null>(null)

// Sync defaults when parent project changes (only if user hasn't manually edited)
let userEditedName = false
let userEditedRegion = false

watch(() => props.defaultParkName, (val) => {
  if (!userEditedName) localPosterName.value = val || ''
})
watch(() => props.defaultRegion, (val) => {
  if (!userEditedRegion) localRegion.value = val || ''
})
watch(localPosterName, () => { userEditedName = true })
watch(localRegion, () => { userEditedRegion = true })

function getBranding() {
  return {
    posterName: localPosterName.value || props.defaultParkName || 'Mon Bikepark',
    region: localRegion.value || props.defaultRegion || '',
    accentColor: localAccentColor.value,
    logoDataUrl: localLogoDataUrl.value,
  }
}

function onExportPoster() {
  emit('export-poster', selectedFormat.value, getBranding())
}

function onExportPdf() {
  emit('export-pdf', selectedFormat.value, getBranding())
}

function onPublishPoster() {
  emit('publish-poster', selectedFormat.value, getBranding())
}

function triggerLogoUpload() {
  logoInputRef.value?.click()
}

function onLogoFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    localLogoDataUrl.value = ev.target?.result as string || ''
  }
  reader.readAsDataURL(file)
  // Reset so same file can be re-picked
  if (logoInputRef.value) logoInputRef.value.value = ''
}
</script>

<style scoped>
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

.panel-header-copy h2 {
  margin: 0;
  font-size: 14px;
  color: #d8ccb6;
}

.panel-header-copy p {
  margin: 4px 0 0;
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

.hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: #b3a890;
}

.fmt-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #b3a890;
  text-transform: uppercase;
}

.fmt-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.fmt-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px 6px;
  border-radius: 10px;
  border: 1.5px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: #c0b59e;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  min-height: 60px;
}

.fmt-btn:hover {
  border-color: rgba(220, 180, 105, 0.4);
  background: rgba(220, 180, 105, 0.08);
  color: #ece2cf;
}

.fmt-btn.active {
  border-color: rgba(220, 180, 105, 0.7);
  background: rgba(220, 180, 105, 0.15);
  color: #f0cd8a;
}

.fmt-icon {
  font-size: 18px;
  line-height: 1;
}

.fmt-name {
  font-size: 11px;
  font-weight: 700;
  color: inherit;
}

.fmt-sub {
  font-size: 9px;
  color: #9a8e78;
  font-weight: 500;
}

.fmt-btn.active .fmt-sub {
  color: #c8b070;
}

/* Branding section */
.branding-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(220, 180, 105, 0.12);
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #c8b070;
  text-transform: uppercase;
}

.branding-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-row--inline {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.field-label {
  font-size: 11px;
  color: #9a8e78;
  font-weight: 500;
}

.text-input {
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #ece2cf;
  font: inherit;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.text-input:focus {
  border-color: rgba(220, 180, 105, 0.5);
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.color-input {
  width: 36px;
  height: 28px;
  padding: 2px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  background: none;
  cursor: pointer;
}

.color-hex {
  font-size: 12px;
  color: #b3a890;
  font-family: monospace;
  min-width: 56px;
}

/* Logo */
.logo-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.logo-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(148,163,184,0.2);
}

.logo-actions {
  display: flex;
  gap: 6px;
}

.logo-btn {
  font: inherit;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255,255,255,0.05);
  color: #c0b59e;
  cursor: pointer;
  transition: background 0.12s;
}

.logo-btn:hover {
  background: rgba(220, 180, 105, 0.1);
  color: #ece2cf;
}

.logo-btn--remove {
  color: #d47a7a;
  border-color: rgba(212, 122, 122, 0.3);
}

.logo-upload-btn {
  font-size: 12px;
  min-height: 36px;
}

.file-input-hidden {
  display: none;
}

.action-button {
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: transparent;
  color: #ece2cf;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button.primary {
  border-color: rgba(220, 180, 105, 0.5);
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.95), rgba(220, 180, 105, 0.95));
  color: #2a2118;
}

.publish-btn {
  border-color: rgba(99, 180, 140, 0.4);
  background: rgba(34, 100, 70, 0.18);
  color: #72d9b0;
}

.publish-btn:hover {
  background: rgba(34, 100, 70, 0.3);
  border-color: rgba(99, 180, 140, 0.6);
}
</style>
