<template>
  <section class="panel">
    <div class="panel-header">
      <div class="placeholder-icon" aria-hidden="true">
        <SidebarIcon name="locate" />
      </div>
      <div class="panel-header-copy">
        <h2>{{ t('locate.title') }}</h2>
        <p>{{ t('locate.desc') }}</p>
      </div>
    </div>

    <form class="search-row" @submit.prevent="search">
      <input
        v-model="query"
        type="text"
        class="search-input"
        :placeholder="t('locate.placeholder')"
      />
      <button type="submit" class="search-btn" :disabled="busy || !query.trim()">
        {{ busy ? '…' : 'OK' }}
      </button>
    </form>

    <p v-if="error" class="search-msg error">{{ error }}</p>
    <p v-else-if="searched && results.length === 0 && !busy" class="search-msg">{{ t('locate.none') }}</p>

    <ul v-if="results.length" class="results">
      <li v-for="r in results" :key="r.place_id">
        <button type="button" class="result" @click="pick(r)">
          <span class="result-name">{{ r.display_name }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SidebarIcon from './SidebarIcon.vue'

const { t } = useI18n()

type NominatimResult = {
  place_id: number
  lat: string
  lon: string
  display_name: string
}

const emit = defineEmits<{
  (e: 'locate', payload: { lng: number; lat: number; label: string }): void
}>()

const query = ref('')
const results = ref<NominatimResult[]>([])
const busy = ref(false)
const error = ref('')
const searched = ref(false)

async function search() {
  const q = query.value.trim()
  if (!q) return
  busy.value = true
  error.value = ''
  searched.value = true
  try {
    const url =
      'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=fr&q=' +
      encodeURIComponent(q)
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('http ' + res.status)
    results.value = (await res.json()) as NominatimResult[]
  } catch (e) {
    console.error('[nominatim]', e)
    error.value = t('locate.unavailable')
    results.value = []
  } finally {
    busy.value = false
  }
}

function pick(r: NominatimResult) {
  emit('locate', { lng: Number(r.lon), lat: Number(r.lat), label: r.display_name })
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

.search-row {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  min-width: 0;
  min-height: 42px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #4a4234;
  background: #1c1813;
  color: #ece2cf;
  font: inherit;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #dcb469;
}

.search-btn {
  flex: 0 0 auto;
  min-width: 48px;
  border-radius: 10px;
  border: 1px solid rgba(220, 180, 105, 0.5);
  background: linear-gradient(135deg, #cda35a, #dcb469);
  color: #2a1f0c;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.search-msg {
  margin: 0;
  font-size: 13px;
  color: #b3a890;
}

.search-msg.error {
  color: #fca5a5;
}

.results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result {
  width: 100%;
  text-align: left;
  padding: 9px 11px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(28, 24, 19, 0.6);
  color: #e2e8f0;
  font: inherit;
  font-size: 12.5px;
  line-height: 1.4;
  cursor: pointer;
}

.result:hover {
  border-color: rgba(220, 180, 105, 0.4);
  background: rgba(28, 24, 19, 0.9);
}
</style>
