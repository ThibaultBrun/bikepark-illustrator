// Canopée illustrée — sème des petits arbres dessinés (feuillus + conifères) dans les polygones
// de forêt du fond "Illustré", pour le rendu poster façon visionmapsstudio. Les arbres sont des
// symboles billboard (restent debout) posés sur le relief 3D. 100% généré par code.
import type maplibregl from 'maplibre-gl'
import { ILLUS_PREFIX } from './illustratedBasemap'

const CANOPY_SOURCE = 'illus-canopy'
const CANOPY_LAYER = 'illus-canopy'
const TREE_KINDS = ['round', 'dark', 'round', 'pine'] as const
type TreeKind = 'round' | 'dark' | 'pine'

// Dessine un arbre illustré dans un canvas 128px → ImageData pour map.addImage.
function treeImageData(kind: TreeKind): ImageData {
  const S = 128
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const x = c.getContext('2d')!
  // ombre portée au sol
  x.fillStyle = 'rgba(40,50,25,0.22)'
  x.beginPath()
  x.ellipse(S / 2, S - 14, 34, 11, 0, 0, Math.PI * 2)
  x.fill()
  // tronc
  x.fillStyle = '#6b4a2a'
  x.fillRect(S / 2 - 5, S - 40, 10, 30)

  const blob = (cx: number, cy: number, r: number, fill: string, line: string | null) => {
    x.beginPath()
    x.arc(cx, cy, r, 0, Math.PI * 2)
    x.fillStyle = fill
    x.fill()
    if (line) {
      x.lineWidth = 3
      x.strokeStyle = line
      x.stroke()
    }
  }

  if (kind === 'pine') {
    const edge = '#234a1b'
    for (let i = 0; i < 3; i++) {
      const y = S - 42 - i * 22
      const w = 40 - i * 9
      x.beginPath()
      x.moveTo(S / 2, y - 30)
      x.lineTo(S / 2 - w, y)
      x.lineTo(S / 2 + w, y)
      x.closePath()
      x.fillStyle = i === 2 ? '#4f7f34' : '#3c6a28'
      x.fill()
      x.lineWidth = 3
      x.strokeStyle = edge
      x.stroke()
    }
  } else {
    const dark = kind === 'dark' ? '#2f5422' : '#3c6a28'
    const light = kind === 'dark' ? '#4e7f32' : '#6fa048'
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

export function ensureTreeImages(map: maplibregl.Map) {
  for (const k of ['round', 'dark', 'pine'] as TreeKind[]) {
    const id = 'tree-' + k
    if (!map.hasImage(id)) map.addImage(id, treeImageData(k), { pixelRatio: 2 })
  }
}

type Ring = number[][]
type Poly = Ring[]

function pointInRing(pt: number[], ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
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

// Génère la canopée pour la vue courante. Grille jitterée dans la bbox, on garde les points
// tombant dans une forêt. Idempotent : met à jour la source si elle existe.
export function scatterCanopy(map: maplibregl.Map, maxTrees = 2600) {
  if (!map.getLayer(ILLUS_PREFIX + 'wood')) return
  const feats = map.querySourceFeatures('openmaptiles', {
    sourceLayer: 'landcover',
    filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
  })
  const polys: Poly[] = []
  for (const f of feats) {
    const g = f.geometry
    if (!g) continue
    if (g.type === 'Polygon') polys.push(g.coordinates as Poly)
    else if (g.type === 'MultiPolygon') for (const p of g.coordinates) polys.push(p as Poly)
  }

  const features: GeoJSON.Feature[] = []
  if (polys.length) {
    const b = map.getBounds()
    const w = b.getWest()
    const e = b.getEast()
    const s = b.getSouth()
    const n = b.getNorth()
    const N = 150
    outer: for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const lng = w + ((e - w) * (i + Math.random())) / N
        const lat = s + ((n - s) * (j + Math.random())) / N
        let inside = false
        for (const poly of polys) {
          if (pointInPoly([lng, lat], poly)) {
            inside = true
            break
          }
        }
        if (!inside) continue
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            img: 'tree-' + TREE_KINDS[(Math.random() * TREE_KINDS.length) | 0],
            s: 0.8 + Math.random() * 0.5,
          },
        })
        if (features.length > maxTrees) break outer
      }
    }
  }

  const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features }
  const src = map.getSource(CANOPY_SOURCE) as maplibregl.GeoJSONSource | undefined
  if (src) {
    src.setData(data)
    return
  }
  map.addSource(CANOPY_SOURCE, { type: 'geojson', data })
  // Insérer SOUS les tracés/symboles de l'utilisateur (= premier calque non-fond),
  // mais au-dessus du relief et des aplats illustrés.
  let beforeId: string | undefined
  const style = map.getStyle()
  if (style?.layers) {
    for (const l of style.layers) {
      if (
        l.id === 'cyclosm' ||
        l.id === 'esri' ||
        l.id === 'terrain-hillshade' ||
        l.id.startsWith(ILLUS_PREFIX)
      )
        continue
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
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          ['*', 0.12, ['get', 's']],
          16,
          ['*', 0.34, ['get', 's']],
          18,
          ['*', 0.6, ['get', 's']],
        ],
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
  if (map.getLayer(CANOPY_LAYER)) {
    map.setLayoutProperty(CANOPY_LAYER, 'visibility', visible ? 'visible' : 'none')
  }
}
