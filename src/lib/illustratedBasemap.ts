// Fond de plan "Illustré" (poster bikepark façon visionmapsstudio) — style MapLibre maison
// sur les tuiles vectorielles OpenMapTiles (OpenFreeMap, gratuit, sans clé, données OSM).
// DA : palette poster saturée (forêt profonde + clairières vives + terre chaude + eau punchy),
// liserés de massifs marqués, relief 2.5D accentué (hillshade chaud). 100% généré par code.
//
// Ces calques sont insérés dans le style de base de MapView (prefixe `illus-`), initialement
// masqués ; `setBaseLayer('illustrated')` bascule leur visibilité. Ils vivent SOUS les tracés
// et symboles du bikepark (ajoutés plus tard au `load`).

export const OFM_VECTOR_URL = 'https://tiles.openfreemap.org/planet'
export const OFM_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'
export const OFM_SPRITE = 'https://tiles.openfreemap.org/sprites/ofm_f384/ofm'

export const ILLUS_PREFIX = 'illus-'

// Palette poster. Saturée mais lisible — pensée pour un pitch 3D avec hillshade chaud par-dessus.
const P = {
  paper: '#dcc89f', // sol nu / fond par défaut (tan sablé chaud, assombri le 2026-11-13)
  paperDim: '#d2bb8c',
  woodDeep: '#4e7a3a', // massif forestier (vert profond)
  woodMid: '#5f9044',
  woodEdge: '#2f5222', // liseré sombre des massifs → effet illustré
  grass: '#9cc46a', // herbe / prairie (clairière vive)
  scrub: '#b4cc7e', // lande / broussaille
  rock: '#cbb88e',
  sand: '#e1cf9c',
  water: '#4f9dd6', // eau punchy
  waterLine: '#2f7cb4',
  building: '#c9a87e',
  buildingLine: '#9d7c52',
  road: '#f4ead0', // asphalte clair chaud
  roadCase: '#caa96f',
  track: '#b07d44', // chemin/piste en terre
  path: '#9a6a39',
  label: '#3a2d1c',
  labelHalo: '#f3e8d0',
  labelWater: '#1f4f72',
  peak: '#6a3b22',
} as const

type AnyLayer = Record<string, unknown>

// Calques vectoriels du fond illustré. visibility 'none' au départ (toggle par setBaseLayer).
export function illustratedLayers(): AnyLayer[] {
  const hidden = { visibility: 'none' as const }
  const SRC = 'openmaptiles'
  const L = (layer: AnyLayer): AnyLayer => ({
    ...layer,
    id: ILLUS_PREFIX + (layer.id as string),
    layout: { ...(layer.layout as object | undefined), ...hidden },
  })

  return [
    // Fond papier (clairière par défaut) — plein écran, sous tout le reste illustré.
    L({ id: 'bg', type: 'background', paint: { 'background-color': P.paper } }),

    // Herbe / prairies / parcs — clairières vives.
    L({
      id: 'grass',
      type: 'fill',
      source: SRC,
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['grass', 'meadow', 'park', 'golf_course']]],
      paint: { 'fill-color': P.grass, 'fill-opacity': 0.8 },
    }),
    L({
      id: 'scrub',
      type: 'fill',
      source: SRC,
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['scrub', 'heath', 'grassland']]],
      paint: { 'fill-color': P.scrub, 'fill-opacity': 0.75 },
    }),
    L({
      id: 'rock',
      type: 'fill',
      source: SRC,
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['bare_rock', 'scree']]],
      paint: { 'fill-color': P.rock, 'fill-opacity': 0.7 },
    }),
    L({
      id: 'sand',
      type: 'fill',
      source: SRC,
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'sand'],
      paint: { 'fill-color': P.sand, 'fill-opacity': 0.85 },
    }),
    L({
      id: 'park',
      type: 'fill',
      source: SRC,
      'source-layer': 'park',
      paint: { 'fill-color': P.grass, 'fill-opacity': 0.5 },
    }),

    // Massifs forestiers — vert profond + liseré sombre marqué (le "trait" illustré).
    // wood-halo : ombre portée large+floue autour du massif → profondeur illustrée.
    L({
      id: 'wood-halo',
      type: 'line',
      source: SRC,
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
      minzoom: 9,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#1a3410',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 5, 13, 14, 17, 24],
        'line-opacity': 0.2,
        'line-blur': 10,
      },
    }),
    L({
      id: 'wood',
      type: 'fill',
      source: SRC,
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          P.woodMid,
          14,
          P.woodDeep,
        ],
        'fill-opacity': 0.92,
      },
    }),
    // wood-feather : liseré doux intérieur (vert moyen+flou) → transition forêt/clairière adoucie.
    L({
      id: 'wood-feather',
      type: 'line',
      source: SRC,
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
      minzoom: 10,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': P.woodMid,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4, 15, 10],
        'line-opacity': 0.28,
        'line-blur': 5,
      },
    }),
    L({
      id: 'wood-edge',
      type: 'line',
      source: SRC,
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
      minzoom: 10,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': P.woodEdge,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.3, 15, 3.8],
        'line-opacity': 0.78,
        'line-blur': 0.5,
      },
    }),

    // Eau.
    L({
      id: 'water',
      type: 'fill',
      source: SRC,
      'source-layer': 'water',
      paint: { 'fill-color': P.water },
    }),
    L({
      id: 'waterway',
      type: 'line',
      source: SRC,
      'source-layer': 'waterway',
      paint: {
        'line-color': P.waterLine,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 16, 3],
      },
    }),

    // Bâtiments (chalets / cabanes du park).
    L({
      id: 'building',
      type: 'fill',
      source: SRC,
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-color': P.building,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, 0.95],
        'fill-outline-color': P.buildingLine,
      },
    }),

    // Voirie — casings puis remplissages.
    L({
      id: 'road-case',
      type: 'line',
      source: SRC,
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service']]],
      minzoom: 11,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': P.roadCase,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 2, 16, 8, 18, 15],
      },
    }),
    L({
      id: 'road',
      type: 'line',
      source: SRC,
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service']]],
      minzoom: 11,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': P.road,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1, 16, 5.5, 18, 11],
      },
    }),
    L({
      id: 'track',
      type: 'line',
      source: SRC,
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'track'],
      minzoom: 12,
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': P.track,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 3],
        'line-dasharray': [3, 1.5],
      },
    }),
    L({
      id: 'path',
      type: 'line',
      source: SRC,
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['path', 'pedestrian']]],
      minzoom: 13,
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': P.path,
        'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.8, 17, 2],
        'line-dasharray': [1.5, 1.5],
      },
    }),

    // Étiquettes contextuelles (villages, cours d'eau, sommets) — discrètes, laissent la place
    // aux labels des pistes du bikepark.
    L({
      id: 'label-peak',
      type: 'symbol',
      source: SRC,
      'source-layer': 'mountain_peak',
      minzoom: 11,
      layout: {
        'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']],
        'text-font': ['Noto Sans Medium'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 13],
        'text-max-width': 8,
      },
      paint: { 'text-color': P.peak, 'text-halo-color': P.labelHalo, 'text-halo-width': 1.8 },
    }),
    L({
      id: 'label-water',
      type: 'symbol',
      source: SRC,
      'source-layer': 'water_name',
      layout: {
        'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']],
        'text-font': ['Noto Sans Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 11, 16, 15],
        'text-max-width': 6,
      },
      paint: { 'text-color': P.labelWater, 'text-halo-color': P.labelHalo, 'text-halo-width': 1.2 },
    }),
    L({
      id: 'label-village',
      type: 'symbol',
      source: SRC,
      'source-layer': 'place',
      filter: ['in', ['get', 'class'], ['literal', ['village', 'hamlet', 'town']]],
      minzoom: 11,
      layout: {
        'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 12, 15, 16],
        'text-max-width': 7,
      },
      paint: { 'text-color': P.label, 'text-halo-color': P.labelHalo, 'text-halo-width': 2, 'text-halo-blur': 0.3 },
    }),
  ]
}

export const ILLUSTRATED_LAYER_IDS_FACTORY = illustratedLayers
