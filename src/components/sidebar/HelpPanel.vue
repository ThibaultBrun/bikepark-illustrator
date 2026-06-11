<template>
  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="help" />
      </div>

      <div class="panel-header-copy">
        <h2>{{ t('help.title') }}</h2>
        <p>{{ t('help.desc') }}</p>
      </div>
    </div>

    <button type="button" class="action-button primary" @click="$emit('start-tour')">
      <Compass class="action-button__icon" aria-hidden="true" />
      <span>{{ t('help.startTour') }}</span>
    </button>

    <ul class="help-list">
      <li v-for="item in helpItems" :key="item.key" class="help-item">
        <span class="help-item__icon" aria-hidden="true">
          <component :is="item.icon" />
        </span>
        <span class="help-item__copy">
          <strong>{{ t(`help.${item.key}Title`) }}</strong>
          <span>{{ t(`help.${item.key}Desc`) }}</span>
        </span>
      </li>
    </ul>

    <p class="help-footnote">{{ t('help.tip') }}</p>

    <div class="lang-row">
      <button
        v-for="l in SUPPORTED_LOCALES"
        :key="l"
        type="button"
        class="lang-btn"
        :class="{ active: locale === l }"
        @click="setLocale(l)"
      >
        {{ t('lang.' + l) }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Compass, Download, Map, Route, Shapes } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import SidebarIcon from './SidebarIcon.vue'
import { SUPPORTED_LOCALES, setLocale } from '../../i18n'

const { t, locale } = useI18n()

defineEmits<{
  (e: 'start-tour'): void
}>()

const helpItems = [
  { key: 'tracks', icon: Route },
  { key: 'symbols', icon: Shapes },
  { key: 'map', icon: Map },
  { key: 'export', icon: Download },
]
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

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba(220, 180, 105, 0.42);
  background: linear-gradient(135deg, rgba(205, 163, 90, 0.9), rgba(220, 180, 105, 0.9));
  color: #f7ecd4;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.15s ease;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(120, 90, 33, 0.3);
  filter: brightness(1.04);
}

.action-button__icon {
  width: 18px;
  height: 18px;
}

.help-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.help-item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.6);
}

.help-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(205, 163, 90, 0.16);
  color: #e7c98a;
}

.help-item__icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.help-item__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.help-item__copy strong {
  font-size: 13px;
  color: #ece2cf;
}

.help-item__copy span {
  font-size: 12px;
  color: #b3a890;
  line-height: 1.45;
}

.help-footnote {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(205, 163, 90, 0.1);
  border: 1px solid rgba(220, 180, 105, 0.18);
  color: #d8ccb6;
  font-size: 12px;
  line-height: 1.5;
}

.help-footnote strong {
  color: #f7ecd4;
}

.lang-row {
  display: flex;
  gap: 8px;
}

.lang-btn {
  flex: 1;
  background: #25211a;
  border: 1px solid #38322a;
  border-radius: 9px;
  padding: 8px;
  color: #b3a890;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.lang-btn.active {
  color: #f0cd8a;
  border-color: rgba(220, 180, 105, 0.5);
}
</style>
