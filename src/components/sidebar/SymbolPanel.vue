<template>
  <section class="panel">
    <div class="panel-title-row">
      <h2>Bibliotheque</h2>
      <span class="hint-badge">Drag & drop</span>
    </div>

    <p class="panel-copy">Glisse un symbole sur la carte ou importe tes propres SVG.</p>

    <label class="upload-btn">
      <span>Importer un SVG</span>
      <input type="file" accept=".svg,image/svg+xml" @change="onSvgFiles" />
    </label>
  </section>

  <section v-if="selectedPlacedSymbol && selectedSymbolDefinition" class="panel">
    <div class="library-title-row">
      <h3>Symbole selectionne</h3>
      <span class="library-count">Edition</span>
    </div>

    <div class="selected-symbol-card">
      <span class="symbol-preview" :style="{ '--symbol-color': selectedSymbolDefinition.color }">
        <span
          class="symbol-preview-core selected-preview-core"
          :style="{
            '--selected-icon-size': `${selectedPlacedSymbol.iconSize}px`,
            '--selected-core-size': `${Math.max(28, selectedPlacedSymbol.iconSize + 8)}px`,
          }"
        >
          <span
            class="symbol-preview-icon selected-preview-icon"
            :style="selectedPreviewTransform"
            v-html="selectedSymbolDefinition.svg"
          ></span>
        </span>
      </span>

      <div class="selected-symbol-meta">
        <div class="symbol-name">{{ selectedSymbolDefinition.label }}</div>
        <div class="size-field">
          <span>Taille</span>

          <div class="size-options">
            <button
              v-for="size in symbolSizeOptions"
              :key="size"
              type="button"
              class="size-option"
              :class="{ active: selectedPlacedSymbol.iconSize === size }"
              :aria-pressed="selectedPlacedSymbol.iconSize === size"
              :title="`Taille ${size}`"
              @click="onSizeSelect(size)"
            >
              <span class="size-option-dot" :style="{ '--size-dot': `${size}px` }"></span>
            </button>
          </div>
        </div>

        <div class="size-field">
          <span>Angle</span>

          <div class="angle-controls">
            <button
              type="button"
              class="size-option transform-option"
              title="Tourner de moins 15 degres"
              @click="adjustRotation(-15)"
            >
              <RotateCw class="transform-icon transform-icon-reverse" />
            </button>

            <button
              type="button"
              class="size-option transform-option"
              title="Tourner de plus 15 degres"
              @click="adjustRotation(15)"
            >
              <RotateCw class="transform-icon" />
            </button>

            <button
              type="button"
              class="size-option transform-option"
              title="Remettre la rotation a zero"
              @click="resetRotation"
            >
              <RefreshCw class="transform-icon" />
            </button>
          </div>
        </div>

        <div class="size-field">
          <span>Miroir</span>

          <div class="size-options">
            <button
              type="button"
              class="size-option transform-option"
              :class="{ active: selectedPlacedSymbol.flipX }"
              :aria-pressed="selectedPlacedSymbol.flipX"
              title="Miroir horizontal"
              @click="toggleFlip('x')"
            >
              <FlipHorizontal2 class="transform-icon" />
            </button>

            <button
              type="button"
              class="size-option transform-option"
              :class="{ active: selectedPlacedSymbol.flipY }"
              :aria-pressed="selectedPlacedSymbol.flipY"
              title="Miroir vertical"
              @click="toggleFlip('y')"
            >
              <FlipVertical2 class="transform-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="panel">
    <div class="library-title-row">
      <h3>Symboles par defaut</h3>
      <span class="library-count">{{ defaultSymbolLibrary.length }}</span>
    </div>

    <div class="symbol-grid">
      <div
        v-for="symbol in defaultSymbolLibrary"
        :key="symbol.id"
        class="symbol-card"
        role="button"
        tabindex="0"
        :title="symbol.description"
        @pointerdown="onPointerDown($event, symbol.id)"
      >
        <span class="symbol-preview" :style="{ '--symbol-color': symbol.color }">
          <span class="symbol-preview-core">
            <span class="symbol-preview-icon" v-html="symbol.svg"></span>
          </span>
        </span>

        <span class="symbol-meta">
          <span class="symbol-name">{{ symbol.label }}</span>
          <span class="symbol-description">{{ symbol.description }}</span>
        </span>
      </div>
    </div>
  </section>

  <section class="panel">
    <div class="library-title-row">
      <h3>Symboles utilisateur</h3>
      <span class="library-count">{{ customSymbols.length }}</span>
    </div>

    <div v-if="customSymbols.length === 0" class="empty-state">
      Aucun SVG importe pour le moment.
    </div>

    <div v-else class="symbol-grid">
      <div
        v-for="symbol in customSymbols"
        :key="symbol.id"
        class="symbol-card custom-symbol-card"
        role="button"
        tabindex="0"
        :title="symbol.label"
        @pointerdown="onPointerDown($event, symbol.id)"
      >
        <span class="symbol-preview custom-preview" :style="{ '--symbol-color': symbol.color }">
          <span class="symbol-preview-core custom-core">
            <span class="symbol-preview-icon" v-html="symbol.svg"></span>
          </span>
        </span>

        <span class="symbol-meta">
          <span class="symbol-name">{{ symbol.label }}</span>
          <span class="symbol-description">SVG utilisateur</span>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FlipHorizontal2, FlipVertical2, RefreshCw, RotateCw } from 'lucide-vue-next'
import { defaultSymbolLibrary, getSymbolDefinition, type MapSymbol, type SymbolDefinition, type SymbolId } from '../../types/symbol'

const props = defineProps<{
  customSymbols: SymbolDefinition[]
  placedSymbols: MapSymbol[]
  selectedSymbolId: string | null
}>()

const emit = defineEmits<{
  (e: 'start-symbol-drag', payload: {
    symbolId: SymbolId
    clientX: number
    clientY: number
  }): void
  (e: 'upload-svg', payload: { label: string; svg: string }): void
  (e: 'update-symbol-size', payload: { symbolId: string; iconSize: number }): void
  (e: 'update-symbol-transform', payload: {
    symbolId: string
    rotation?: number
    flipX?: boolean
    flipY?: boolean
  }): void
}>()

const selectedPlacedSymbol = computed(() => {
  if (!props.selectedSymbolId) return null
  return props.placedSymbols.find((symbol) => symbol.id === props.selectedSymbolId) ?? null
})

const selectedSymbolDefinition = computed(() => {
  if (!selectedPlacedSymbol.value) return null
  return getSymbolDefinition(selectedPlacedSymbol.value.symbolId, props.customSymbols)
})

const symbolSizeOptions = [14, 20, 23, 26, 29]
const selectedPreviewTransform = computed(() => {
  if (!selectedPlacedSymbol.value) return {}

  return {
    transform: `rotate(${selectedPlacedSymbol.value.rotation}deg) scaleX(${selectedPlacedSymbol.value.flipX ? -1 : 1}) scaleY(${selectedPlacedSymbol.value.flipY ? -1 : 1})`,
  }
})

function onPointerDown(event: PointerEvent, symbolId: SymbolId) {
  if (event.button !== 0) return

  emit('start-symbol-drag', {
    symbolId,
    clientX: event.clientX,
    clientY: event.clientY,
  })

  event.preventDefault()
}

function onSizeSelect(iconSize: number) {
  if (!selectedPlacedSymbol.value) return

  emit('update-symbol-size', {
    symbolId: selectedPlacedSymbol.value.id,
    iconSize,
  })
}

function adjustRotation(delta: number) {
  if (!selectedPlacedSymbol.value) return

  emit('update-symbol-transform', {
    symbolId: selectedPlacedSymbol.value.id,
    rotation: selectedPlacedSymbol.value.rotation + delta,
  })
}

function resetRotation() {
  if (!selectedPlacedSymbol.value) return

  emit('update-symbol-transform', {
    symbolId: selectedPlacedSymbol.value.id,
    rotation: 0,
  })
}

function toggleFlip(axis: 'x' | 'y') {
  if (!selectedPlacedSymbol.value) return

  emit('update-symbol-transform', {
    symbolId: selectedPlacedSymbol.value.id,
    ...(axis === 'x'
      ? { flipX: !selectedPlacedSymbol.value.flipX }
      : { flipY: !selectedPlacedSymbol.value.flipY }),
  })
}

async function onSvgFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return

  for (const file of Array.from(files)) {
    const svg = await file.text()
    const label = file.name.replace(/\.svg$/i, '')
    emit('upload-svg', { label, svg })
  }

  input.value = ''
}
</script>

<style scoped>
.panel {
  margin-bottom: 16px;
  padding: 14px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
}

.panel-title-row,
.library-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.panel h2,
.panel h3 {
  margin: 0;
  font-size: 14px;
  color: #cbd5e1;
}

.hint-badge,
.library-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #1e293b;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 700;
}

.panel-copy {
  margin: 0 0 14px;
  color: #94a3b8;
  line-height: 1.5;
  font-size: 13px;
}

.upload-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(59, 130, 246, 0.2));
  border: 1px dashed rgba(96, 165, 250, 0.42);
  color: #dbeafe;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.upload-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(147, 197, 253, 0.75);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.24), rgba(59, 130, 246, 0.24));
}

.upload-btn input {
  display: none;
}

.empty-state {
  color: #94a3b8;
  font-size: 13px;
}

.selected-symbol-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px;
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.96));
}

.selected-symbol-meta {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  flex: 1;
}

.size-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.size-field span {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

.size-options {
  display: flex;
  align-items: center;
  gap: 6px;
}

.angle-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size-option {
  --size-dot: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 31px;
  height: 31px;
  padding: 0;
  border: 1px solid rgba(51, 65, 85, 0.95);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.88);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.size-option:hover {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.34);
}

.size-option.active {
  border-color: rgba(96, 165, 250, 0.8);
  background: linear-gradient(180deg, rgba(30, 64, 175, 0.38), rgba(30, 41, 59, 0.94));
  box-shadow:
    0 0 0 1px rgba(147, 197, 253, 0.22),
    0 10px 24px rgba(2, 6, 23, 0.22);
}

.size-option-dot {
  display: inline-flex;
  width: clamp(6px, calc(var(--size-dot) / 2), 14px);
  height: clamp(6px, calc(var(--size-dot) / 2), 14px);
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.symbol-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.symbol-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.96));
  color: #e5e7eb;
  text-align: left;
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.symbol-card:hover {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.4);
  box-shadow: 0 12px 28px rgba(2, 6, 23, 0.22);
}

.symbol-card:active {
  cursor: grabbing;
}

.symbol-card:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.9);
  outline-offset: 2px;
}

.symbol-preview {
  --symbol-color: #3b82f6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  flex: 0 0 auto;
  background: color-mix(in srgb, var(--symbol-color) 7%, #0f172a);
  border: 1px solid color-mix(in srgb, var(--symbol-color) 14%, #1e293b);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.custom-preview {
  background: rgba(255, 255, 255, 0.94);
  border-color: rgba(148, 163, 184, 0.12);
}

.symbol-preview-core {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--symbol-color);
  color: #ffffff;
}

.symbol-preview-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease;
}

.selected-preview-core {
  width: min(var(--selected-core-size), 34px);
  height: min(var(--selected-core-size), 34px);
}

.custom-core {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: transparent;
  color: #0f172a;
}

.symbol-preview-icon :deep(svg) {
  width: 14px;
  height: 14px;
}

.selected-preview-icon :deep(svg) {
  width: min(var(--selected-icon-size), 22px);
  height: min(var(--selected-icon-size), 22px);
}

.custom-core .symbol-preview-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.transform-option {
  color: #e2e8f0;
}

.transform-icon {
  width: 14px;
  height: 14px;
}

.transform-icon-reverse {
  transform: scaleX(-1);
}


.symbol-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.symbol-name {
  font-size: 12px;
  font-weight: 700;
  color: #f8fafc;
}

.symbol-description {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.35;
  color: #94a3b8;
}

@media (max-width: 480px) {
  .symbol-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
