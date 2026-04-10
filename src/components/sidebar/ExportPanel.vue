<template>
  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="export" />
      </div>

      <div class="panel-header-copy">
        <h2>Projet</h2>
        <p>Le projet se sauvegarde tout seul dans le navigateur. Ici on garde juste l import et l export.</p>
      </div>
    </div>

    <div class="action-grid">
      <button type="button" class="action-button primary" @click="$emit('export-zip')">
        Exporter en ZIP
      </button>

      <label class="action-button import-button">
        <span>Importer un ZIP</span>
        <input type="file" accept=".zip" @change="onZipSelected" />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import SidebarIcon from './SidebarIcon.vue'

const emit = defineEmits<{
  (e: 'export-zip'): void
  (e: 'import-zip', file: File): void
}>()

function onZipSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  emit('import-zip', file)
  input.value = ''
}
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
  padding: 14px;
  background: #111827;
  border: 1px solid #1f2937;
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
  color: #cbd5e1;
}

.panel-header-copy p {
  margin: 0;
  color: #94a3b8;
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
  background: rgba(37, 99, 235, 0.18);
  border: 1px solid rgba(96, 165, 250, 0.28);
  color: #dbeafe;
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
  color: #e2e8f0;
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
  border-color: rgba(96, 165, 250, 0.4);
  box-shadow: 0 12px 28px rgba(2, 6, 23, 0.22);
}

.action-button.primary {
  border-color: rgba(96, 165, 250, 0.42);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(59, 130, 246, 0.9));
  color: #eff6ff;
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
</style>
