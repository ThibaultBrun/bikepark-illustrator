<template>
  <div ref="mapShell" class="map-shell">
    <div
      ref="mapContainer"
      class="map"
      :class="{ 'symbol-drop-active': isSymbolDragOver }"
    ></div>

    <div v-if="isSymbolDragOver" class="symbol-drop-overlay">
      Depose le symbole sur la carte
    </div>

    <div
      v-if="isDraggingPlacedSymbol"
      ref="trashDropzone"
      class="trash-dropzone"
      :class="{ active: isPlacedSymbolOverTrash }"
    >
      <Trash2 class="trash-dropzone-icon" aria-hidden="true" />
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
        :class="{ active: baseLayer === 'cyclosm' }"
        @click="setBaseLayer('cyclosm')"
      >
        Cyclo
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import { Trash2 } from 'lucide-vue-next'
import type { GpxTrack } from '../types/gpx'
import type { MapCameraState } from '../types/project'
import type { MapLabelFont } from './sidebar/map-settings'
import { getSymbolDefinition, getSymbolSvg, type MapSymbol, type SymbolDefinition, type SymbolId } from '../types/symbol'

const props = withDefaults(
  defineProps<{
    tracks?: GpxTrack[]
    symbols?: MapSymbol[]
    customSymbols: SymbolDefinition[]
    draggingSymbolType?: SymbolId | null
    dragPointer?: { x: number; y: number }
    terrainExaggeration?: number
    hillshadeStrength?: number
    labelFont?: MapLabelFont
    savedCamera?: MapCameraState | null
    cameraRestoreKey?: number
    fitRequest?: { type: 'project' | 'track'; trackId?: string; nonce: number } | null
  }>(),
  {
    tracks: () => [],
    symbols: () => [],
    customSymbols: () => [],
    draggingSymbolType: null,
    dragPointer: () => ({ x: 0, y: 0 }),
    terrainExaggeration: 1.4,
    hillshadeStrength: 100,
    labelFont: 'segoe',
    savedCamera: null,
    cameraRestoreKey: 0,
    fitRequest: null,
  },
)

const emit = defineEmits<{
  (e: 'update-label-position', payload: { trackId: string; position: [number, number] }): void
  (e: 'add-symbol', payload: { symbolId: SymbolId; position: [number, number] }): void
  (e: 'complete-symbol-drag'): void
  (e: 'remove-symbol', payload: { symbolId: string }): void
  (e: 'select-symbol', payload: { symbolId: string | null }): void
  (e: 'update-symbol-position', payload: { symbolId: string; position: [number, number] }): void
  (e: 'update-symbol-size', payload: { symbolId: string; iconSize: number }): void
  (e: 'update-camera', payload: MapCameraState): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const mapShell = ref<HTMLDivElement | null>(null)
const trashDropzone = ref<HTMLDivElement | null>(null)
const isSymbolDragOver = ref(false)
const isDraggingPlacedSymbol = ref(false)
const isPlacedSymbolOverTrash = ref(false)

let map: maplibregl.Map | null = null
let draggedTrackId: string | null = null
let draggedPlacedSymbolId: string | null = null
let isDraggingLabel = false
let suppressNextCameraEmit = false
let restoredSavedCameraOnLoad = false
let skipNextTrackAutoFit = false
const symbolMarkers = new Map<string, maplibregl.Marker>()

const baseLayer = ref<'cyclosm' | 'esri'>('cyclosm')

const initialCenter: [number, number] = [-1.69, 43.31]
const initialZoom = 14
const initialPitch = 0
const initialBearing = -20
const arrivalBounds = [
  [-9.492188, 41.558114],
  [13.183594, 54.445336],
] as const satisfies [[number, number], [number, number]]

function initialCamera() {
  if (props.savedCamera) {
    return {
      center: props.savedCamera.center,
      zoom: props.savedCamera.zoom,
      pitch: props.savedCamera.pitch,
      bearing: props.savedCamera.bearing,
    }
  }

  return {
    center: initialCenter,
    zoom: initialZoom,
    pitch: initialPitch,
    bearing: initialBearing,
  }
}

function buildStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      cyclosm: {
        type: 'raster',
        tiles: [
          'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
          'https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
          'https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors, style CyclOSM',
      },
      'esri-world-imagery': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution:
          'Tiles © Esri - Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      },
    },
    layers: [
      {
        id: 'cyclosm',
        type: 'raster',
        source: 'cyclosm',
        layout: { visibility: 'visible' },
      },
      {
        id: 'esri',
        type: 'raster',
        source: 'esri-world-imagery',
        layout: { visibility: 'none' },
      },
    ],
  }
}

function setBaseLayer(layer: 'cyclosm' | 'esri') {
  if (!map) return

  baseLayer.value = layer

  if (map.getLayer('cyclosm')) {
    map.setLayoutProperty('cyclosm', 'visibility', layer === 'cyclosm' ? 'visible' : 'none')
  }

  if (map.getLayer('esri')) {
    map.setLayoutProperty('esri', 'visibility', layer === 'esri' ? 'visible' : 'none')
  }
}

function fitToArrivalBounds(duration = 1000) {
  if (!map) return

  fitMapToBounds(new maplibregl.LngLatBounds(arrivalBounds[0], arrivalBounds[1]), duration)
}

function currentCameraState(): MapCameraState | null {
  if (!map) return null

  const center = map.getCenter()
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  }
}

function fitMapToBounds(bounds: maplibregl.LngLatBounds, duration = 1000) {
  if (!map || bounds.isEmpty()) return

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches
  const padding = isMobile
    ? { top: 96, right: 28, bottom: 140, left: 28 }
    : { top: 72, right: 72, bottom: 92, left: 96 }
  const targetPitch = Math.min(map.getPitch(), 44)
  const fitPitch = 10
  suppressNextCameraEmit = true

  map.fitBounds(bounds, {
    padding,
    duration,
    pitch: fitPitch,
    bearing: map.getBearing(),
    essential: true,
  })

  // In perspective view, a bounds fit that looks perfect in 2D often feels too tight.
  // We fit flatter first, then restore the 3D pitch with a slight zoom-out compensation.
  if (targetPitch > fitPitch) {
    map.once('moveend', () => {
      if (!map) return

      suppressNextCameraEmit = true
      map.easeTo({
        pitch: targetPitch,
        zoom: map.getZoom() - 0.45,
        duration: 450,
        essential: true,
      })
    })
  }
}

function applyTerrainState() {
  if (!map) return
  if (!map.getSource('terrain-dem')) return

  if (props.terrainExaggeration > 0) {
    map.setTerrain({
      source: 'terrain-dem',
      exaggeration: props.terrainExaggeration,
    })
  } else {
    map.setTerrain(null)
  }

  if (map.getLayer('terrain-hillshade')) {
    map.setPaintProperty(
      'terrain-hillshade',
      'hillshade-exaggeration',
      Math.min(props.terrainExaggeration * 0.2, 1),
    )
  }
}

function applyHillshadeState() {
  if (!map || !map.getLayer('terrain-hillshade')) return

  const opacity = Math.max(0, Math.min(props.hillshadeStrength / 100, 1))

  map.setLayoutProperty('terrain-hillshade', 'visibility', opacity > 0 ? 'visible' : 'none')
  map.setPaintProperty('terrain-hillshade', 'hillshade-shadow-color', `rgba(0, 0, 0, ${opacity})`)
  map.setPaintProperty(
    'terrain-hillshade',
    'hillshade-highlight-color',
    `rgba(255, 255, 255, ${opacity * 0.9})`,
  )
  map.setPaintProperty(
    'terrain-hillshade',
    'hillshade-accent-color',
    `rgba(31, 41, 55, ${opacity})`,
  )
}

function dashArrayForStyle(style: GpxTrack['style']) {
  if (style === 'dashed') return [3, 2]
  if (style === 'dotted') return [1, 2]
  return undefined
}

function arrowLayerVisibility(track: GpxTrack) {
  return track.visible && (track.style === 'arrow' || track.style === 'arrow-reverse')
    ? 'visible'
    : 'none'
}

function arrowSymbolForStyle(style: GpxTrack['style']) {
  return style === 'arrow-reverse' ? '\u2190' : '\u2192'
}

function linePaintForTrack(track: GpxTrack): maplibregl.LinePaint {
  const dashArray = dashArrayForStyle(track.style)

  return {
    'line-color': track.color,
    'line-width': track.width,
    'line-opacity': 0.95,
    ...(dashArray ? { 'line-dasharray': dashArray } : {}),
  }
}

function fontStackForLabelFont(labelFont: MapLabelFont) {
  if (labelFont === 'arial') return ['Arial']
  if (labelFont === 'verdana') return ['Verdana']
  if (labelFont === 'trebuchet') return ['Trebuchet MS']
  if (labelFont === 'tahoma') return ['Tahoma']
  if (labelFont === 'georgia') return ['Georgia']
  if (labelFont === 'palatino') return ['Palatino Linotype', 'Book Antiqua']
  if (labelFont === 'cambria') return ['Cambria']
  if (labelFont === 'impact') return ['Impact']
  if (labelFont === 'courier') return ['Courier New']
  return ['Segoe UI']
}

function labelLetterSpacingForFont(labelFont: MapLabelFont) {
  if (labelFont === 'impact') return 0.04
  if (labelFont === 'courier') return 0.02
  if (labelFont === 'trebuchet') return 0.01
  return 0
}

function labelTextSizeForFont(labelFont: MapLabelFont) {
  if (labelFont === 'impact') return 17
  if (labelFont === 'georgia' || labelFont === 'palatino' || labelFont === 'cambria') return 17
  if (labelFont === 'courier') return 15
  return 16
}

function labelPaintForTrack(track: GpxTrack): maplibregl.SymbolPaint {
  if (track.labelStyle === 'soft') {
    return {
      'text-color': track.color,
      'text-halo-color': 'rgba(255,255,255,0.72)',
      'text-halo-width': 1.2,
      'text-opacity': 0.94,
    }
  }

  if (track.labelStyle === 'bold') {
    return {
      'text-color': track.color,
      'text-halo-color': 'rgba(255,255,255,1)',
      'text-halo-width': 3.2,
      'text-opacity': 1,
    }
  }

  if (track.labelStyle === 'ghost') {
    return {
      'text-color': 'rgba(255,255,255,0.96)',
      'text-halo-color': 'rgba(15,23,42,0.84)',
      'text-halo-width': 1.8,
      'text-opacity': 0.96,
    }
  }

  if (track.labelStyle === 'stamp') {
    return {
      'text-color': 'rgba(255,255,255,0.98)',
      'text-halo-color': track.color,
      'text-halo-width': 2.4,
      'text-opacity': 1,
    }
  }

  return {
    'text-color': track.color,
    'text-halo-color': 'rgba(255,255,255,0.98)',
    'text-halo-width': 2,
    'text-opacity': 1,
  }
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

function buildTrackLineData(track: GpxTrack): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: (track.geojson.features ?? []).filter((feature) => {
      const geometryType = feature.geometry?.type
      return geometryType === 'LineString' || geometryType === 'MultiLineString'
    }),
  }
}

function refreshSymbols() {
  if (!map) return

  const nextIds = new Set(props.symbols.map((symbol) => symbol.id))

  for (const symbol of props.symbols) {
    const definition = getSymbolDefinition(symbol.symbolId, props.customSymbols)
    const existingMarker = symbolMarkers.get(symbol.id)

    if (existingMarker) {
      const element = existingMarker.getElement()
      const outerSize = Math.max(24, Math.min(symbol.iconSize + 11, 42))
      const coreSize = Math.max(18, Math.min(symbol.iconSize + 7, 34))
      element.style.setProperty('--marker-size', `${outerSize}px`)
      element.style.setProperty('--marker-core-size', `${coreSize}px`)
      element.style.setProperty('--marker-icon-size', `${symbol.iconSize}px`)
      element.style.setProperty('--marker-rotation', `${symbol.rotation}deg`)
      element.style.setProperty('--marker-scale-x', symbol.flipX ? '-1' : '1')
      element.style.setProperty('--marker-scale-y', symbol.flipY ? '-1' : '1')
      existingMarker.setLngLat(symbol.lngLat)
      continue
    }

    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'map-symbol-marker'
    element.style.setProperty('--symbol-color', definition.color)
    element.style.setProperty('--marker-size', `${Math.max(24, Math.min(symbol.iconSize + 11, 42))}px`)
    element.style.setProperty('--marker-core-size', `${Math.max(18, Math.min(symbol.iconSize + 7, 34))}px`)
    element.style.setProperty('--marker-icon-size', `${symbol.iconSize}px`)
    element.style.setProperty('--marker-rotation', `${symbol.rotation}deg`)
    element.style.setProperty('--marker-scale-x', symbol.flipX ? '-1' : '1')
    element.style.setProperty('--marker-scale-y', symbol.flipY ? '-1' : '1')
    element.title = definition.label
    element.innerHTML = `<span class="map-symbol-marker__core"><span class="map-symbol-marker__icon">${getSymbolSvg(symbol.symbolId, props.customSymbols)}</span></span>`
    element.addEventListener('click', (event) => {
      event.stopPropagation()
      emit('select-symbol', { symbolId: symbol.id })
    })

    const marker = new maplibregl.Marker({
      element,
      anchor: 'center',
      draggable: true,
    })
      .setLngLat(symbol.lngLat)
      .addTo(map)

    marker.on('dragstart', () => {
      draggedPlacedSymbolId = symbol.id
      isDraggingPlacedSymbol.value = true
      isPlacedSymbolOverTrash.value = false
    })

    marker.on('drag', () => {
      const markerRect = element.getBoundingClientRect()
      const trashRect = trashDropzone.value?.getBoundingClientRect()

      if (!trashRect) {
        isPlacedSymbolOverTrash.value = false
        return
      }

      const markerCenterX = markerRect.left + markerRect.width / 2
      const markerCenterY = markerRect.top + markerRect.height / 2

      isPlacedSymbolOverTrash.value =
        markerCenterX >= trashRect.left &&
        markerCenterX <= trashRect.right &&
        markerCenterY >= trashRect.top &&
        markerCenterY <= trashRect.bottom
    })

    marker.on('dragend', () => {
      if (draggedPlacedSymbolId === symbol.id && isPlacedSymbolOverTrash.value) {
        emit('remove-symbol', { symbolId: symbol.id })
        draggedPlacedSymbolId = null
        isDraggingPlacedSymbol.value = false
        isPlacedSymbolOverTrash.value = false
        return
      }

      const lngLat = marker.getLngLat()
      emit('update-symbol-position', {
        symbolId: symbol.id,
        position: [lngLat.lng, lngLat.lat],
      })

      draggedPlacedSymbolId = null
      isDraggingPlacedSymbol.value = false
      isPlacedSymbolOverTrash.value = false
    })

    symbolMarkers.set(symbol.id, marker)
  }

  for (const [symbolId, marker] of symbolMarkers.entries()) {
    if (nextIds.has(symbolId)) continue
    marker.remove()
    symbolMarkers.delete(symbolId)
  }
}

function ensureTrackSource(track: GpxTrack) {
  if (!map) return

  const sourceId = `track-source-${track.id}`
  const existing = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
  const trackLineData = buildTrackLineData(track)

  if (existing) {
    existing.setData(trackLineData as GeoJSON.GeoJSON)
  } else {
    map.addSource(sourceId, {
      type: 'geojson',
      data: trackLineData as GeoJSON.GeoJSON,
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
  const labelSourceId = `track-label-source-${track.id}`
  const lineId = `track-line-${track.id}`
  const labelId = `track-label-${track.id}`
  const arrowId = `track-arrow-${track.id}`

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
      paint: linePaintForTrack(track),
    })
  }

  if (!map.getLayer(labelId)) {
    map.addLayer({
      id: labelId,
      type: 'symbol',
      source: labelSourceId,
      layout: {
        'symbol-placement': 'point',
        'text-field': ['get', 'label'],
        'text-font': fontStackForLabelFont(props.labelFont),
        'text-letter-spacing': labelLetterSpacingForFont(props.labelFont),
        'text-size': track.labelSize,
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
        ...labelPaintForTrack(track),
      },
    })
  }

  if (!map.getLayer(arrowId)) {
    map.addLayer({
      id: arrowId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 48,
        'text-field': arrowSymbolForStyle(track.style),
        'text-size': 14,
        'text-rotation-alignment': 'map',
        'text-keep-upright': false,
        visibility: arrowLayerVisibility(track),
      },
      paint: {
        'text-color': track.color,
        'text-halo-color': 'rgba(255,255,255,0.95)',
        'text-halo-width': 1.2,
      },
    })
  }
}

function rebuildTrackLineLayer(track: GpxTrack) {
  if (!map) return

  const sourceId = `track-source-${track.id}`
  const lineId = `track-line-${track.id}`
  const labelId = `track-label-${track.id}`
  const arrowId = `track-arrow-${track.id}`

  if (map.getLayer(lineId)) {
    map.removeLayer(lineId)
  }

  map.addLayer(
    {
      id: lineId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
        visibility: track.visible ? 'visible' : 'none',
      },
      paint: linePaintForTrack(track),
    },
    map.getLayer(arrowId) ? arrowId : map.getLayer(labelId) ? labelId : undefined,
  )
}

function rebuildTrackLabelLayer(track: GpxTrack) {
  if (!map) return

  const labelSourceId = `track-label-source-${track.id}`
  const labelId = `track-label-${track.id}`
  const arrowId = `track-arrow-${track.id}`

  if (map.getLayer(labelId)) {
    map.removeLayer(labelId)
  }

  map.addLayer(
    {
      id: labelId,
      type: 'symbol',
      source: labelSourceId,
      layout: {
        'symbol-placement': 'point',
        'text-field': ['get', 'label'],
        'text-font': fontStackForLabelFont(props.labelFont),
        'text-size': track.labelSize,
        'text-letter-spacing': labelLetterSpacingForFont(props.labelFont),
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
        ...labelPaintForTrack(track),
      },
    },
    map.getLayer(arrowId) ? arrowId : undefined,
  )
}

function updateTrackLayers(track: GpxTrack) {
  if (!map) return

  const lineId = `track-line-${track.id}`
  const labelId = `track-label-${track.id}`
  const arrowId = `track-arrow-${track.id}`

  if (map.getLayer(lineId)) {
    rebuildTrackLineLayer(track)
  }

  if (map.getLayer(labelId)) {
    rebuildTrackLabelLayer(track)
  }

  if (map.getLayer(labelId)) {
    map.setLayoutProperty(labelId, 'visibility', track.visible ? 'visible' : 'none')
    map.setLayoutProperty(labelId, 'text-size', track.labelSize)
    const labelPaint = labelPaintForTrack(track)
    map.setPaintProperty(labelId, 'text-color', labelPaint['text-color'])
    map.setPaintProperty(labelId, 'text-halo-color', labelPaint['text-halo-color'])
    map.setPaintProperty(labelId, 'text-halo-width', labelPaint['text-halo-width'])
    map.setPaintProperty(labelId, 'text-opacity', labelPaint['text-opacity'])
  }

  if (map.getLayer(arrowId)) {
    map.setLayoutProperty(arrowId, 'visibility', arrowLayerVisibility(track))
    map.setLayoutProperty(arrowId, 'text-field', arrowSymbolForStyle(track.style))
    map.setPaintProperty(arrowId, 'text-color', track.color)
  }

  if (map.getLayer(labelId)) {
    map.moveLayer(labelId)
  }

  if (map.getLayer(arrowId)) {
    map.moveLayer(arrowId)
  }

  map.triggerRepaint()
}

function removeDeletedTrackLayers() {
  if (!map) return

  const existingIds = new Set(props.tracks.map((track) => track.id))
  const style = map.getStyle()

  for (const layer of style.layers ?? []) {
    const match = layer.id.match(/^track-(line|label|arrow)-(.+)$/)
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
  map.triggerRepaint()
  requestAnimationFrame(() => {
    map?.triggerRepaint()
  })
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
    fitMapToBounds(bounds, 1000)
  }
}

function fitToTrack(trackId: string) {
  if (!map) return

  const track = props.tracks.find((item) => item.id === trackId)
  if (!track) return

  const bounds = new maplibregl.LngLatBounds()

  for (const coord of flattenLineCoordinates(track.geojson)) {
    bounds.extend(coord)
  }

  if (!bounds.isEmpty()) {
    fitMapToBounds(bounds, 900)
  }
}

function restoreSavedCamera() {
  if (!map || !props.savedCamera) return false

  map.stop()
  suppressNextCameraEmit = true
  restoredSavedCameraOnLoad = true
  map.jumpTo({
    center: props.savedCamera.center,
    zoom: props.savedCamera.zoom,
    pitch: props.savedCamera.pitch,
    bearing: props.savedCamera.bearing,
  })
  return true
}

function setupCameraTracking() {
  if (!map) return

  map.on('moveend', () => {
    const camera = currentCameraState()
    if (!camera) return

    if (suppressNextCameraEmit) {
      suppressNextCameraEmit = false
    }

    emit('update-camera', camera)
  })
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

  window.addEventListener('pointerup', handleGlobalPointerUp, true)

  const camera = initialCamera()

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: buildStyle(),
    center: camera.center,
    zoom: camera.zoom,
    pitch: camera.pitch,
    bearing: camera.bearing,
    maxPitch: 85,
    maxTileCacheSize: 100,
    maxZoom: 20,
  })

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right')
  map.on('click', () => {
    emit('select-symbol', { symbolId: null })
  })

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
        'hillshade-exaggeration': Math.min(props.terrainExaggeration * 0.2, 1),
        'hillshade-shadow-color': '#000000',
        'hillshade-highlight-color': '#ffffff',
        'hillshade-accent-color': '#1f2937',
      },
    })

    map.setTerrain({
      source: 'terrain-dem',
      exaggeration: props.terrainExaggeration,
    })

    if (
      typeof (map as maplibregl.Map & { setSky?: (value: unknown) => void }).setSky === 'function'
    ) {
      ;(map as maplibregl.Map & { setSky: (value: unknown) => void }).setSky({
        'sky-color': '#7db7ff',
        'sky-horizon-blend': 0.4,
        'horizon-color': '#ffffff',
        'horizon-fog-blend': 0.01,
        'fog-color': '#d0e6ff',
        'fog-ground-blend': 0.001,
      })
    }

    applyTerrainState()
    applyHillshadeState()
    setBaseLayer(baseLayer.value)
    refreshTracks()
    refreshSymbols()
    setupLabelDragging()
    setupCameraTracking()

    if (!props.savedCamera) {
      map.easeTo({
        pitch: initialPitch,
        bearing: initialBearing,
        duration: 600,
        essential: true,
      })
    }

    requestAnimationFrame(() => {
      refreshTracks()
      refreshSymbols()
    })

    map.once('idle', () => {
      refreshTracks()
      refreshSymbols()

      if (props.savedCamera) {
        return
      }

      if (props.tracks.length > 0) {
        fitToTracks()
      } else {
        fitToArrivalBounds(0)
      }
    })
  })
})

watch(
  () => props.tracks,
  () => {
    refreshTracks()
  },
  { deep: true, flush: 'post' },
)

watch(
  () => props.symbols,
  () => {
    refreshSymbols()
  },
  { deep: true, flush: 'post' },
)

watch(
  () => [props.draggingSymbolType, props.dragPointer.x, props.dragPointer.y] as const,
  ([draggingSymbolType, clientX, clientY]) => {
    if (!mapContainer.value || !draggingSymbolType) {
      isSymbolDragOver.value = false
      return
    }

    const rect = mapContainer.value.getBoundingClientRect()
    isSymbolDragOver.value =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
  },
  { flush: 'post' },
)

function handleMapPointerUp(event: PointerEvent) {
  if (!props.draggingSymbolType || !map || !mapContainer.value) return

  const rect = mapContainer.value.getBoundingClientRect()
  const insideMap =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom

  if (!insideMap) return

  const point = [event.clientX - rect.left, event.clientY - rect.top] as [number, number]
  const lngLat = map.unproject(point)

  emit('add-symbol', {
    symbolId: props.draggingSymbolType,
    position: [lngLat.lng, lngLat.lat],
  })
  emit('complete-symbol-drag')
}

function handleGlobalPointerUp(event: PointerEvent) {
  handleMapPointerUp(event)
}

watch(
  () => props.tracks?.length ?? 0,
  (newLen, oldLen) => {
    if (newLen > oldLen) {
      if (skipNextTrackAutoFit) {
        skipNextTrackAutoFit = false
        return
      }

      if (restoredSavedCameraOnLoad) {
        restoredSavedCameraOnLoad = false
        return
      }

      setTimeout(() => {
        refreshTracks()
        fitToTracks()
      }, 50)
    }
  },
)

watch(
  () => props.terrainExaggeration,
  () => {
    applyTerrainState()
    applyHillshadeState()
  },
)

watch(
  () => props.hillshadeStrength,
  () => {
    applyHillshadeState()
  },
)

watch(
  () => props.labelFont,
  () => {
    refreshTracks()
  },
)

watch(
  () => [props.savedCamera, props.cameraRestoreKey] as const,
  ([savedCamera], [previousCamera]) => {
    if (!map) return

    if (!savedCamera) {
      if (props.cameraRestoreKey === 0) return

      map.stop()
      suppressNextCameraEmit = true

      if (props.tracks.length > 0) {
        fitToTracks()
      } else {
        fitToArrivalBounds(0)
      }
      return
    }

    const hasChanged =
      !previousCamera ||
      savedCamera.center[0] !== previousCamera.center[0] ||
      savedCamera.center[1] !== previousCamera.center[1] ||
      savedCamera.zoom !== previousCamera.zoom ||
      savedCamera.pitch !== previousCamera.pitch ||
      savedCamera.bearing !== previousCamera.bearing

    if (!hasChanged && props.cameraRestoreKey === 0) return

    skipNextTrackAutoFit = true
    map.stop()
    suppressNextCameraEmit = true
    map.jumpTo({
      center: savedCamera.center,
      zoom: savedCamera.zoom,
      pitch: savedCamera.pitch,
      bearing: savedCamera.bearing,
    })
  },
  { deep: true },
)

watch(
  () => props.fitRequest,
  (request) => {
    if (!request) return

    if (request.type === 'project') {
      fitToTracks()
      return
    }

    if (request.type === 'track' && request.trackId) {
      fitToTrack(request.trackId)
    }
  },
  { deep: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', handleGlobalPointerUp, true)

  if (map) {
    map.getCanvas().style.cursor = ''
    if (isDraggingLabel) {
      map.dragPan.enable()
    }
  }

  map?.remove()
  map = null
  draggedTrackId = null
  draggedPlacedSymbolId = null
  isDraggingLabel = false
  isSymbolDragOver.value = false
  isDraggingPlacedSymbol.value = false
  isPlacedSymbolOverTrash.value = false
  restoredSavedCameraOnLoad = false
  symbolMarkers.clear()
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

.map.symbol-drop-active {
  filter: saturate(1.05);
}

.symbol-drop-overlay {
  position: absolute;
  inset: 24px;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(96, 165, 250, 0.9);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.16);
  color: #eff6ff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.02em;
  pointer-events: none;
  backdrop-filter: blur(2px);
}

.trash-dropzone {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 14;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  padding: 0;
  border-radius: 20px;
  border: 1px solid rgba(248, 113, 113, 0.24);
  background: rgba(15, 23, 42, 0.94);
  color: #fecaca;
  box-shadow: 0 16px 34px rgba(2, 6, 23, 0.34);
  backdrop-filter: blur(14px);
  pointer-events: none;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

.trash-dropzone.active {
  transform: scale(1.06);
  background: rgba(127, 29, 29, 0.92);
  border-color: rgba(252, 165, 165, 0.62);
  color: #ffffff;
  box-shadow:
    0 18px 40px rgba(127, 29, 29, 0.34),
    0 0 0 1px rgba(252, 165, 165, 0.35);
}

.trash-dropzone-icon {
  width: 24px;
  height: 24px;
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

:global(.map-symbol-marker) {
  --symbol-color: #3b82f6;
  --marker-size: 28px;
  --marker-core-size: 24px;
  --marker-icon-size: 17px;
  --marker-rotation: 0deg;
  --marker-scale-x: 1;
  --marker-scale-y: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--marker-size);
  height: var(--marker-size);
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--symbol-color) 20%, white);
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.14),
    0 0 0 1px rgba(255, 255, 255, 0.58);
  cursor: grab;
}

:global(.map-symbol-marker:active) {
  cursor: grabbing;
}

:global(.map-symbol-marker__core) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--marker-core-size);
  height: var(--marker-core-size);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
}

:global(.map-symbol-marker__icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: rotate(var(--marker-rotation)) scaleX(var(--marker-scale-x)) scaleY(var(--marker-scale-y));
  transition: transform 0.18s ease;
}

:global(.map-symbol-marker__icon svg) {
  width: var(--marker-icon-size);
  height: var(--marker-icon-size);
}
</style>
