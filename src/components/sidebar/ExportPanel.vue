<template>
  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="export" />
      </div>

      <div class="panel-header-copy">
        <h2>Projet</h2>
        <p>Ton projet se sauvegarde tout seul dans ton compte. Ici : soumettre à Pista ou exporter.</p>
      </div>
    </div>

    <div class="block">
      <div class="block-title">Soumettre à Pista</div>

      <button
        type="button"
        class="action-button primary"
        :disabled="!canSubmit"
        @click="$emit('submit-project')"
      >
        {{ spotStatus ? 'Mettre à jour ma soumission' : 'Soumettre à Pista' }}
      </button>
      <p class="hint">
        Enregistre ton spot et tes pistes <strong>en privé</strong> : visibles seulement par toi
        (et les admins Pista). Pour les rendre publics, fais une demande de publication.
      </p>

      <template v-if="spotStatus === 'draft'">
        <button type="button" class="action-button" @click="$emit('request-publication')">
          Demander la publication
        </button>
        <p class="hint">Un admin Pista validera avant la mise en ligne publique.</p>
      </template>
      <p v-else-if="spotStatus === 'submitted'" class="status status--pending">
        ⏳ En attente de validation par un admin Pista.
      </p>
      <p v-else-if="spotStatus === 'published'" class="status status--ok">
        ✅ Publié sur Pista.
      </p>
    </div>

    <div class="block">
      <div class="block-title">Export local</div>
      <div class="action-grid">
        <button type="button" class="action-button" @click="$emit('export-zip')">
          Exporter en ZIP
        </button>
        <label class="action-button import-button">
          <span>Importer un ZIP</span>
          <input type="file" accept=".zip" @change="onZipSelected" />
        </label>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import SidebarIcon from './SidebarIcon.vue'

defineProps<{
  canSubmit: boolean
  spotStatus: 'draft' | 'submitted' | 'published' | 'archived' | null
}>()

const emit = defineEmits<{
  (e: 'export-zip'): void
  (e: 'import-zip', file: File): void
  (e: 'submit-project'): void
  (e: 'request-publication'): void
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
</style>
