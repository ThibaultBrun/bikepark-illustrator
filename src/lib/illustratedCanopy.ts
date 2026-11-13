// Canopée illustrée — sème des petits arbres dessinés (feuillus + conifères) dans les polygones
// de forêt du fond "Illustré", pour le rendu poster façon visionmapsstudio. Les arbres sont des
// symboles billboard (restent debout) posés sur le relief 3D. 100% généré par code.
import type maplibregl from 'maplibre-gl'
import { ILLUS_PREFIX } from './illustratedBasemap'

const CANOPY_SOURCE = 'illus-canopy'
const CANOPY_LAYER = 'illus-canopy'

const TREE_KINDS = ['round', 'dark', 'pine', 'spruce', 'autumn', 'cluster'] as const
type TreeKind = (typeof TREE_KINDS)[number]

// Tirage pondéré (cumuls sur 100)
const KIND_CUM = [25, 45, 63, 76, 88, 100]
function pickKind(): TreeKind {
  const r = Math.random() * 100
  for (let i = 0; i < KIND_CUM.length; i++) if (r < KIND_CUM[i]) return TREE_KINDS[i]
  return 'round'
}

// Génère une ImageData 128px pour un arbre.
// tintShift : -1..+1, décale légèrement la teinte pour variation naturelle.
function treeImageData(kind: TreeKind, tintShift = 0): ImageData {
  const S = 128
  const c = document.createElement('canvas')
  c.width = S; c.height = S
  const x = c.getContext('2d')!

  // Ombre portée directionnelle (lumière NW → ombre SE, cohérente avec hillshade)
  x.fillStyle = 'rgba(28,42,14,0.30)'
  x.beginPath()
  x.ellipse(S / 2 + 20, S - 9, 36, 10, -0.15, 0, Math.PI * 2)
  x.fill()

  // Tronc
  x.fillStyle = '#6b4a2a'
  x.fillRect(S / 2 - 5, S - 40, 10, 30)

  // Helper : shift couleur RGB
  const tint = ([r, g, b]: [number, number, number]): string => {
    const sh = Math.round(tintShift * 16)
    return `rgb(${clamp(r + sh)},${g},${clamp(b + sh)})`
  }

  const blob = (cx: number, cy: number, r: number, fill: string, line: string | null) => {
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2)
    x.fillStyle = fill; x.fill()
    if (line) { x.lineWidth = 2.5; x.strokeStyle = line; x.stroke() }
  }

  if (kind === 'pine' || kind === 'spruce') {
    const edge = '#1e3d16'
    const layers = kind === 'spruce' ? 4 : 3
    for (let i = 0; i < layers; i++) {
      const yBase = S - 42 - i * (kind === 'spruce' ? 17 : 22)
      const w = (kind === 'spruce' ? 30 : 40) - i * 7
      x.beginPath()
      x.moveTo(S / 2, yBase - 26)
      x.lineTo(S / 2 - w, yBase)
      x.lineTo(S / 2 + w, yBase)
      x.closePath()
      x.fillStyle = i === layers - 1 ? tint([79, 127, 52]) : tint([58, 102, 38])
      x.fill()
      x.lineWidth = 2.5; x.strokeStyle = edge; x.stroke()
    }
  } else if (kind === 'autumn') {
    // Feuillus automne — teintes chaudes orange/rouge/jaune
    const edge = '#5a3010'
    const c1 = `rgb(${clamp(185 + Math.round(tintShift * 25))},95,28)`
    const c2 = `rgb(${clamp(205 + Math.round(tintShift * 15))},138,38)`
    const c3 = 'rgb(222,160,46)'
    blob(S / 2, S - 54, 30, c1, edge)
    blob(S / 2 - 20, S - 50, 20, c2, edge)
    blob(S / 2 + 20, S - 50, 20, c1, edge)
    blob(S / 2 - 10, S - 66, 18, c2, null)
    blob(S / 2 + 12, S - 64, 16, c3, null)
    blob(S / 2, S - 74, 16, c2, null)
  } else if (kind === 'cluster') {
    // Petit bosquet : 3 arbres côte à côte
    const edge = '#234a1b'
    const positions: [number, number, number][] = [[-22, 2, 15], [2, -7, 20], [24, 2, 15]]
    for (const [dx, dy, r] of positions) {
      blob(S / 2 + dx, S - 50 + dy, r, tint([48, 84, 34]), edge)
      blob(S / 2 + dx, S - 50 + dy - r * 0.5, r * 0.6, tint([72, 118, 48]), null)
    }
  } else {
    // round / dark : feuillus classique
    const dark = kind === 'dark' ? tint([47, 82, 32]) : tint([60, 106, 40])
    const light = kind === 'dark' ? tint([78, 125, 50]) : tint([108, 158, 68])
    const edge = '#234a1b'
    blob(S / 2, S - 54, 30, dark, edge)
    blob(S / 2 - 20, S - 50, 20, dark, edge)
    blob(S / 2 + 20, S - 50, 20, dark, edge)
    blob(S / 2 - 10, S - 66, 18, light, null)
    blob(S / 2 + 12, S - 64, 16, light, null)
    blob(S / 2, S - 74, 16, light, null)
  }
  return x.getImageData(0, 0, S, S)
}

function clamp(v: number): number { return Math.max(0, Math.min(255, v)) }

// 3 variantes de teinte par espèce = 18 images au total (légères, 128px)
const TINT_STEPS = 3

export function ensureTreeImages(map: maplibregl.Map) {
  for (const k of TREE_KINDS) {
    for (let t = 0; t < TINT_STEPS; t++) {
      const id = `tree-${k}-${t}`
      if (!map.hasImage(id)) {
        const tintShift = t === 0 ? -0.7 : t === 1 ? 0 : 0.7
        map.addImage(id, treeImageData(k, tintShift), { pixelRatio: 2 })
      }
    }
  }
}

type Ring = number[][]
type Poly = Ring[]

interface BoundedPoly {
  poly: Poly
  bbox: [number, number, number, number] // west, south, east, north
}

function polyBbox(poly: Poly): [number, number, number, number] {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity
  for (const [lng, lat] of poly[0]) {
    if (lng < w) w = lng; if (lng > e) e = lng
    if (lat < s) s = lat; if (lat > n) n = lat
  }
  return [w, s, e, n]
}

function pointInRing(pt: number[], ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]
    const hit = yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi
    if (hit) inside = !inside
  }
  return inside
}

function pointInPoly(pt: number[], poly: Poly): boolean {
  if (!pointInRing(pt, poly[0])) return false
  for (let h = 1; h < poly.length; h++) if (pointInRing(pt, poly[h])) return false
  return true
}

// Génère la canopée pour la vue courante. Densité adaptative au zoom.
// Utilise un pré-filtre bbox par polygone pour éviter le O(N² × polys) naïf.
export function scatterCanopy(map: maplibregl.Map) {
  if (!map.getLayer(ILLUS_PREFIX + 'wood')) return
  const feats = map.querySourceFeatures('openmaptiles', {
    sourceLayer: 'landcover',
    filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
  })

  const bounded: BoundedPoly[] = []
  for (const f of feats) {
    const g = f.geometry
    if (!g) continue
    if (g.type === 'Polygon') {
      const poly = g.coordinates as Poly
      bounded.push({ poly, bbox: polyBbox(poly) })
    } else if (g.type === 'MultiPolygon') {
      for (const p of g.coordinates) {
        const poly = p as Poly
        bounded.push({ poly, bbox: polyBbox(poly) })
      }
    }
  }

  const features: GeoJSON.Feature[] = []
  if (bounded.length) {
    const b = map.getBounds()
    const w = b.getWest(), e = b.getEast(), s = b.getSouth(), n = b.getNorth()

    // Densité adaptative : z≤11 → 25 %, z≥16 → 100 %
    const zoom = map.getZoom()
    const density = Math.max(0.25, Math.min(1, (zoom - 11) / 5))
    const N = Math.round(85 + density * 115) // grille 85→200
    const maxTrees = Math.round(1200 + density * 3800) // 1200→5000 max

    outer: for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const lng = w + ((e - w) * (i + Math.random())) / N
        const lat = s + ((n - s) * (j + Math.random())) / N
        const pt = [lng, lat]
        let inside = false
        for (const { poly, bbox } of bounded) {
          if (lng < bbox[0] || lng > bbox[2] || lat < bbox[1] || lat > bbox[3]) continue
          if (pointInPoly(pt, poly)) { inside = true; break }
        }
        if (!inside) continue
        const kind = pickKind()
        const tintIdx = Math.floor(Math.random() * TINT_STEPS)
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            img: `tree-${kind}-${tintIdx}`,
            s: 0.72 + Math.random() * 0.65,
            rot: (Math.random() - 0.5) * 18, // ±9° anti-sticker
          },
        })
        if (features.length >= maxTrees) break outer
      }
    }
  }

  const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features }
  const src = map.getSource(CANOPY_SOURCE) as maplibregl.GeoJSONSource | undefined
  if (src) { src.setData(data); return }

  map.addSource(CANOPY_SOURCE, { type: 'geojson', data })

  // Insérer sous les tracés/symboles utilisateur, au-dessus du fond illustré
  let beforeId: string | undefined
  const style = map.getStyle()
  if (style?.layers) {
    for (const l of style.layers) {
      if (
        l.id === 'cyclosm' || l.id === 'esri' ||
        l.id === 'terrain-hillshade' || l.id.startsWith(ILLUS_PREFIX)
      ) continue
      beforeId = l.id
      break
    }
  }
  map.addLayer(
    {
      id: CANOPY_LAYER,
      type: 'symbol',
      source: CANOPY_SOURCE,
      layout: {
        'icon-image': ['get', 'img'],
        'icon-size': [
          'interpolate', ['linear'], ['zoom'],
          12, ['*', 0.09, ['get', 's']],
          15, ['*', 0.28, ['get', 's']],
          18, ['*', 0.56, ['get', 's']],
        ],
        'icon-rotate': ['get', 'rot'],
        'icon-rotation-alignment': 'viewport',
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-pitch-alignment': 'viewport',
        'symbol-sort-key': ['-', 0, ['get', 's']],
      },
    } as maplibregl.LayerSpecification,
    beforeId,
  )
}

export function setCanopyVisible(map: maplibregl.Map, visible: boolean) {
  if (map.getLayer(CANOPY_LAYER))
    map.setLayoutProperty(CANOPY_LAYER, 'visibility', visible ? 'visible' : 'none')
}
