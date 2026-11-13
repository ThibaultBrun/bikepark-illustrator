<template>
  <div class="module3d-panel">
    <p class="module3d-panel__hint">
      Clique sur un module pour le placer sur la carte. Fais glisser pour repositionner.
    </p>

    <div class="module3d-grid">
      <button
        v-for="type in moduleTypes"
        :key="type"
        type="button"
        class="module3d-card"
        :class="{ active: pendingType === type }"
        :title="`Placer : ${MODULE3D_LABELS[type]}`"
        @click="$emit('pick-module3d', type)"
      >
        <span class="module3d-card__preview" v-html="MODULE3D_SVG[type]" />
        <span class="module3d-card__label">{{ MODULE3D_LABELS[type] }}</span>
      </button>
    </div>

    <div v-if="placedModules.length" class="module3d-placed">
      <div class="module3d-placed__header">Sur la carte</div>
      <div
        v-for="mod in placedModules"
        :key="mod.id"
        class="module3d-placed__item"
      >
        <span class="module3d-placed__icon" v-html="MODULE3D_SVG[mod.type]" />
        <span class="module3d-placed__name">{{ MODULE3D_LABELS[mod.type] }}</span>
        <div class="module3d-placed__controls">
          <label class="module3d-placed__scale-label">
            <span>{{ Math.round(mod.scale * 100) }}%</span>
            <input
              type="range"
              min="30"
              max="300"
              step="5"
              :value="Math.round(mod.scale * 100)"
              class="module3d-placed__scale"
              @input="$emit('update-module3d-scale', { id: mod.id, scale: Number(($event.target as HTMLInputElement).value) / 100 })"
            />
          </label>
          <label class="module3d-placed__rot-label">
            <span>{{ mod.rotation }}°</span>
            <input
              type="range"
              min="0"
              max="359"
              step="5"
              :value="mod.rotation"
              class="module3d-placed__rot"
              @input="$emit('update-module3d-rotation', { id: mod.id, rotation: Number(($event.target as HTMLInputElement).value) })"
            />
          </label>
          <button
            type="button"
            class="module3d-placed__move"
            title="Déplacer"
            @click="$emit('move-module3d', mod.id)"
          >✥</button>
          <button
            type="button"
            class="module3d-placed__remove"
            title="Supprimer"
            @click="$emit('remove-module3d', mod.id)"
          >×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MODULE3D_SVG, MODULE3D_LABELS, type Module3D, type Module3DType } from '../../types/module3d'

const moduleTypes: Module3DType[] = ['jump', 'double', 'table', 'berm', 'pumptrack', 'northshore']

defineProps<{
  placedModules: Module3D[]
  pendingType?: Module3DType | null
}>()

defineEmits<{
  (e: 'pick-module3d', type: Module3DType): void
  (e: 'remove-module3d', id: string): void
  (e: 'move-module3d', id: string): void
  (e: 'update-module3d-scale', payload: { id: string; scale: number }): void
  (e: 'update-module3d-rotation', payload: { id: string; rotation: number }): void
}>()
</script>

<style scoped>
.module3d-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 0;
}

.module3d-panel__hint {
  font-size: 12px;
  color: var(--color-text-muted, #888);
  margin: 0;
  padding: 0 4px;
  line-height: 1.4;
}

.module3d-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.module3d-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px 8px;
  background: var(--color-surface, #1e1e1e);
  border: 1.5px solid var(--color-border, #333);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.module3d-card:hover {
  border-color: #d4a040;
  background: var(--color-surface-hover, #262626);
}

.module3d-card.active {
  border-color: #d4a040;
  background: rgba(212, 160, 64, 0.08);
}

.module3d-card__preview {
  display: block;
  width: 60px;
  height: 42px;
}

.module3d-card__preview :deep(svg) {
  width: 100%;
  height: 100%;
}

.module3d-card__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text, #ddd);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Placed modules list */
.module3d-placed {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--color-border, #333);
  padding-top: 12px;
}

.module3d-placed__header {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted, #888);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.module3d-placed__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--color-surface, #1e1e1e);
  border-radius: 6px;
  border: 1px solid var(--color-border, #333);
}

.module3d-placed__icon {
  display: block;
  width: 32px;
  height: 22px;
  flex-shrink: 0;
}

.module3d-placed__icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.module3d-placed__name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text, #ddd);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module3d-placed__controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.module3d-placed__scale-label,
.module3d-placed__rot-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: var(--color-text-muted, #888);
}

.module3d-placed__scale,
.module3d-placed__rot {
  width: 48px;
  cursor: pointer;
  accent-color: #d4a040;
}

.module3d-placed__move,
.module3d-placed__remove {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}

.module3d-placed__move {
  background: var(--color-surface-hover, #2a2a2a);
  color: var(--color-text, #ddd);
}

.module3d-placed__move:hover {
  background: rgba(212, 160, 64, 0.2);
  color: #d4a040;
}

.module3d-placed__remove {
  background: var(--color-surface-hover, #2a2a2a);
  color: var(--color-text-muted, #888);
}

.module3d-placed__remove:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
</style>
