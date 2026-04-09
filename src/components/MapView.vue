<template>
  <div class="map-shell">
    <div ref="mapContainer" class="map"></div>

    <div class="map-toolbar">
      <button type="button" @click="toggleTerrain">
        {{ terrainEnabled ? 'Relief ON' : 'Relief OFF' }}
      </button>

      <button type="button" @click="toggleHillshade">
        {{ hillshadeEnabled ? 'Ombrage ON' : 'Ombrage OFF' }}
      </button>

      <button type="button" @click="resetView">
        Recentrer
      </button>
    </div>

    <div class="baselayer-switcher">
      <button
        type="button"
        :class="{ active: baseLayer === 'esri' }"
        @click="setBaseLayer('esri')"
      >
        Satellite
      </button>

      <button
        type="button"
        :class="{ active: baseLayer === 'osm' }"
        @click="setBaseLayer('osm')"
      >
        Carte
      </button>
    </div>

    <div class="terrain-slider">
      <input
        v-model.number="terrainExaggeration"
        type="range"
        min="1"
        max="10"
        step="0.1"
        @input="applyTerrainState"
      />
      <div class="terrain-label">
        x{{ terrainExaggeration.toFixed(1) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import type { GpxTrack } from '../types/gpx'

const props = withDefaults(
  defineProps<{
    tracks?: GpxTrack[]
  }>(),
  {
    tracks: () => [],
  },
)

const emit = defineEmits<{
  (e: 'update-label-position', payload: { trackId: string; position: [number, number] }): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)

let map: maplibregl.Map | null = null
let draggedTrackId: string | null = null
let isDraggingLabel = false

const terrainEnabled = ref(true)
const hillshadeEnabled = ref(true)
const baseLayer = ref<'osm' | 'esri'>('esri')
const terrainExaggeration = ref(1.35)

const initialCenter: [number, number] = [-1.69, 43.31]
const initialZoom = 14
const initialPitch = 65
const initialBearing = -20

function buildStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
      'esri-world-imagery': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution:
          'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
        layout: { visibility: 'none' },
      },
      {
        id: 'esri',
        type: 'raster',
        source: 'esri-world-imagery',
        layout: { visibility: 'visible' },
      },
    ],
  }
}

function setBaseLayer(layer: 'osm' | 'esri') {
  if (!map) return
  baseLayer.value = layer

  if (map.getLayer('osm')) {
    map.setLayoutProperty('osm', 'visibility', layer === 'osm' ? 'visible' : 'none')
  }

  if (map.getLayer('esri')) {
    map.setLayoutProperty('esri', 'visibility', layer === 'esri' ? 'visible' : 'none')
  }
}

function applyTerrainState() {
  if (!map) return

  if (terrainEnabled.value) {
    map.setTerrain({
      source: 'terrain-dem',
      exaggeration: terrainExaggeration.value,
    })
  } else {
    map.setTerrain(null)
  }

  if (map.getLayer('terrain-hillshade')) {
    map.setPaintProperty(
      'terrain-hillshade',
      'hillshade-exaggeration',
      Math.min(terrainExaggeration.value * 0.6, 6),
    )
  }
}

function applyHillshadeState() {
  if (!map || !map.getLayer('terrain-hillshade')) return

  map.setLayoutProperty(
    'terrain-hillshade',
    'visibility',
    hillshadeEnabled.value ? 'visible' : 'none',
  )
}

function toggleTerrain() {
  terrainEnabled.value = !terrainEnabled.value
  applyTerrainState()
}

function toggleHillshade() {
  hillshadeEnabled.value = !hillshadeEnabled.value
  applyHillshadeState()
}

function resetView() {
  if (!map) return

  map.easeTo({
    center: initialCenter,
    zoom: initialZoom,
    pitch: initialPitch,
    bearing: initialBearing,
    duration: 1000,
    essential: true,
  })
}

function dashArrayForStyle(style: GpxTrack['style']) {
  if (style === 'dashed') return [3, 2]
  if (style === 'dotted') return [1, 2]
  return [1, 0]
}

function flattenLineCoordinates(geojson: GeoJSON.FeatureCollection): [number, number][] {
  const coords: [number, number][] = []

  for (const feature of geojson.features ?? []) {
    const geometry = feature.geometry
    if (!geometry) continue

    if (geometry.type === 'LineString') {
      for (const coord of geometry.coordinates) {
        coords.push([coord[0], coord[1]])
      }
    }

    if (geometry.type === 'MultiLineString') {
      for (const line of geometry.coordinates) {
        for (const coord of line) {
          coords.push([coord[0], coord[1]])
        }
      }
    }
  }

  return coords
}

function buildLabelPoint(track: GpxTrack): GeoJSON.FeatureCollection {
  const coords = flattenLineCoordinates(track.geojson)

  if (coords.length === 0) {
    return {
      type: 'FeatureCollection',
      features: [],
    }
  }

  const midIndex = Math.floor(coords.length / 2)
  const coord = track.labelPosition ?? coords[midIndex]

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          label: track.label || track.name,
          color: track.color,
          trackId: track.id,
        },
        geometry: {
          type: 'Point',
          coordinates: coord,
        },
      },
    ],
  }
}

function ensureTrackSource(track: GpxTrack) {
  if (!map) return

  const sourceId = `track-source-${track.id}`
  const existing = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined

  if (existing) {
    existing.setData(track.geojson as GeoJSON.GeoJSON)
  } else {
    map.addSource(sourceId, {
      type: 'geojson',
      data: track.geojson as GeoJSON.GeoJSON,
    })
  }
}

function ensureTrackLabelSource(track: GpxTrack) {
  if (!map) return

  const labelSourceId = `track-label-source-${track.id}`
  const labelData = buildLabelPoint(track)
  const existing = map.getSource(labelSourceId) as maplibregl.GeoJSONSource | undefined

  if (existing) {
    existing.setData(labelData as GeoJSON.GeoJSON)
  } else {
    map.addSource(labelSourceId, {
      type: 'geojson',
      data: labelData as GeoJSON.GeoJSON,
    })
  }
}

function ensureTrackLayers(track: GpxTrack) {
  if (!map) return

  const sourceId = `track-source-${track.id}`
  const lineId = `track-line-${track.id}`

  if (!map.getLayer(lineId)) {
    map.addLayer({
      id: lineId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
        visibility: track.visible ? 'visible' : 'none',
      },
      paint: {
        'line-color': track.color,
        'line-width': track.width,
        'line-opacity': 0.95,
        'line-dasharray': dashArrayForStyle(track.style),
      },
    })
  }

  const labelSourceId = `track-label-source-${track.id}`
  const labelId = `track-label-${track.id}`

  if (!map.getLayer(labelId)) {
    map.addLayer({
      id: labelId,
      type: 'symbol',
      source: labelSourceId,
      layout: {
        'symbol-placement': 'point',
        'text-field': ['get', 'label'],
        'text-size': 16,
        'text-padding': 4,
        'text-pitch-alignment': 'viewport',
        'text-rotation-alignment': 'viewport',
        'text-keep-upright': true,
        'text-anchor': 'center',
        'text-offset': [0, 0],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        visibility: track.visible ? 'visible' : 'none',
      },
      paint: {
        'text-color': track.color,
        'text-halo-color': 'rgba(255,255,255,0.98)',
        'text-halo-width': 2,
      },
    })
  }
}

function updateTrackLayers(track: GpxTrack) {
  if (!map) return

  const lineId = `track-line-${track.id}`
  const labelId = `track-label-${track.id}`

  if (map.getLayer(lineId)) {
    map.setPaintProperty(lineId, 'line-color', track.color)
    map.setPaintProperty(lineId, 'line-width', track.width)
    map.setPaintProperty(lineId, 'line-dasharray', dashArrayForStyle(track.style))
    map.setLayoutProperty(lineId, 'visibility', track.visible ? 'visible' : 'none')
  }

  if (map.getLayer(labelId)) {
    map.setLayoutProperty(labelId, 'visibility', track.visible ? 'visible' : 'none')
    map.setPaintProperty(labelId, 'text-color', track.color)
  }
}

function removeDeletedTrackLayers() {
  if (!map) return

  const existingIds = new Set(props.tracks.map((track) => track.id))
  const style = map.getStyle()

  for (const layer of style.layers ?? []) {
    const match = layer.id.match(/^track-(line|label)-(.+)$/)
    if (!match) continue

    const trackId = match[2]
    if (!existingIds.has(trackId) && map.getLayer(layer.id)) {
      map.removeLayer(layer.id)
    }
  }

  for (const sourceId of Object.keys(style.sources ?? {})) {
    const match =
      sourceId.match(/^track-source-(.+)$/) ||
      sourceId.match(/^track-label-source-(.+)$/)

    if (!match) continue

    const trackId = match[1]
    if (!existingIds.has(trackId) && map.getSource(sourceId)) {
      map.removeSource(sourceId)
    }
  }
}

function refreshTracks() {
  if (!map || !map.isStyleLoaded()) return

  for (const track of props.tracks) {
    ensureTrackSource(track)
    ensureTrackLabelSource(track)
    ensureTrackLayers(track)
    updateTrackLayers(track)
  }

  removeDeletedTrackLayers()
}

function fitToTracks() {
  if (!map || props.tracks.length === 0) return

  const bounds = new maplibregl.LngLatBounds()

  for (const track of props.tracks) {
    const features = track.geojson.features ?? []

    for (const feature of features) {
      const geometry = feature.geometry
      if (!geometry) continue

      if (geometry.type === 'LineString') {
        for (const coord of geometry.coordinates) {
          bounds.extend(coord as [number, number])
        }
      }

      if (geometry.type === 'MultiLineString') {
        for (const line of geometry.coordinates) {
          for (const coord of line) {
            bounds.extend(coord as [number, number])
          }
        }
      }
    }
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 60,
      duration: 1000,
      pitch: Math.min(map.getPitch(), 55),
      bearing: map.getBearing(),
    })
  }
}

function setupLabelDragging() {
  if (!map) return

  map.on('mousemove', (e) => {
    if (!map) return

    if (isDraggingLabel) {
      map.getCanvas().style.cursor = 'grabbing'
      return
    }

    const labelLayerIds = props.tracks.map((track) => `track-label-${track.id}`)
    const existingLayerIds = labelLayerIds.filter((id) => map!.getLayer(id))

    if (existingLayerIds.length === 0) {
      map.getCanvas().style.cursor = ''
      return
    }

    const features = map.queryRenderedFeatures(e.point, {
      layers: existingLayerIds,
    })

    map.getCanvas().style.cursor = features.length > 0 ? 'grab' : ''
  })

  map.on('mousedown', (e) => {
    if (!map) return

    const labelLayerIds = props.tracks.map((track) => `track-label-${track.id}`)
    const existingLayerIds = labelLayerIds.filter((id) => map!.getLayer(id))

    if (existingLayerIds.length === 0) return

    const features = map.queryRenderedFeatures(e.point, {
      layers: existingLayerIds,
    })

    if (features.length === 0) return

    const feature = features[0]
    const trackId =
      (feature.properties?.trackId as string | undefined) ??
      feature.layer.id.replace('track-label-', '')

    if (!trackId) return

    draggedTrackId = trackId
    isDraggingLabel = true

    map.dragPan.disable()
    map.getCanvas().style.cursor = 'grabbing'

    e.preventDefault()
  })

  map.on('mousemove', (e) => {
    if (!map || !isDraggingLabel || !draggedTrackId) return

    emit('update-label-position', {
      trackId: draggedTrackId,
      position: [e.lngLat.lng, e.lngLat.lat],
    })
  })

  map.on('mouseup', () => {
    if (!map) return

    if (isDraggingLabel) {
      isDraggingLabel = false
      draggedTrackId = null
      map.dragPan.enable()
      map.getCanvas().style.cursor = ''
    }
  })

  map.on('mouseleave', () => {
    if (!map) return

    if (isDraggingLabel) {
      isDraggingLabel = false
      draggedTrackId = null
      map.dragPan.enable()
    }

    map.getCanvas().style.cursor = ''
  })
}

onMounted(() => {
  if (!mapContainer.value) return

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: buildStyle(),
    center: initialCenter,
    zoom: initialZoom,
    pitch: initialPitch,
    bearing: initialBearing,
    maxPitch: 85,
  })

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right')

  map.on('load', () => {
    if (!map) return

    map.addSource('terrain-dem', {
      type: 'raster-dem',
      url: 'https://tiles.mapterhorn.com/tilejson.json',
      tileSize: 256,
      maxzoom: 18,
    })

    map.addLayer({
      id: 'terrain-hillshade',
      type: 'hillshade',
      source: 'terrain-dem',
      paint: {
        'hillshade-exaggeration': Math.min(terrainExaggeration.value * 0.6, 6),
        'hillshade-shadow-color': '#000000',
        'hillshade-highlight-color': '#ffffff',
        'hillshade-accent-color': '#1f2937',
      },
    })

    map.setTerrain({
      source: 'terrain-dem',
      exaggeration: terrainExaggeration.value,
    })

    if (typeof (map as any).setSky === 'function') {
      ;(map as any).setSky({
        'sky-color': '#7db7ff',
        'sky-horizon-blend': 0.4,
        'horizon-color': '#ffffff',
        'horizon-fog-blend': 0.25,
        'fog-color': '#d0e6ff',
        'fog-ground-blend': 0.15,
      })
    }

    applyTerrainState()
    applyHillshadeState()
    setBaseLayer(baseLayer.value)
    refreshTracks()
    setupLabelDragging()

    if (props.tracks.length > 0) {
      fitToTracks()
    }

    map.easeTo({
      pitch: initialPitch,
      bearing: initialBearing,
      duration: 600,
      essential: true,
    })
  })
})

watch(
  () => props.tracks,
  () => {
    refreshTracks()
  },
  { deep: true },
)

watch(
  () => props.tracks?.length ?? 0,
  (newLen, oldLen) => {
    if (newLen > oldLen) {
      setTimeout(() => {
        fitToTracks()
      }, 50)
    }
  },
)

onBeforeUnmount(() => {
  if (map) {
    map.getCanvas().style.cursor = ''
    if (isDraggingLabel) {
      map.dragPan.enable()
    }
  }

  map?.remove()
  map = null
  draggedTrackId = null
  isDraggingLabel = false
})
</script>

<style scoped>
.map-shell {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 100%;
}

.map-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.map-toolbar button {
  border: 1px solid #d1d5db;
  background: rgba(255, 255, 255, 0.96);
  color: #111827;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.map-toolbar button:hover {
  background: #ffffff;
}

.baselayer-switcher {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.96);
  padding: 6px;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.baselayer-switcher button {
  border: 0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  background: #f3f4f6;
  color: #111827;
}

.baselayer-switcher button.active {
  background: #111827;
  color: white;
}

.terrain-slider {
  position: absolute;
  right: 16px;
  bottom: 80px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.terrain-slider input[type='range'] {
  writing-mode: vertical-lr;
  direction: rtl;
  height: 120px;
  width: 24px;
  cursor: pointer;
}

.terrain-label {
  font-size: 11px;
  font-weight: 600;
  color: #111827;
}
</style>