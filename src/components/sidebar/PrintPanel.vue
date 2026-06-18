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

    <button type="button" class="action-button primary" @click="$emit('export-image')">
      {{ t('print.exportPng') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SidebarIcon from './SidebarIcon.vue'

const { t } = useI18n()

defineEmits<{
  (e: 'export-image'): void
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
