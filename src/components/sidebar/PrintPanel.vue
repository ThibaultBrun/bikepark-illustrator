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

    <button type="button" class="action-button primary" @click="$emit('export-poster', selectedFormat)">
      🎨 {{ t('print.exportPoster') }}
    </button>

    <button type="button" class="action-button" @click="$emit('export-pdf', selectedFormat)">
      📄 {{ t('print.exportPdf') }}
    </button>

    <button type="button" class="action-button" @click="$emit('export-image')">
      {{ t('print.exportPng') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SidebarIcon from './SidebarIcon.vue'
import { PRINT_FORMATS, type PrintFormatId } from '../../lib/printFormats'

const { t } = useI18n()

const selectedFormat = ref<PrintFormatId>('a4p')

defineEmits<{
  (e: 'export-image'): void
  (e: 'export-poster', formatId: PrintFormatId): void
  (e: 'export-pdf', formatId: PrintFormatId): void
}>()
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
</style>
