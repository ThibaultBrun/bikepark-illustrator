// Compositeur poster illustré : map blob → canvas A4-ish avec titre, légende, crédit.
import type { GpxTrack } from '../types/gpx'
import type { MapSymbol, SymbolDefinition } from '../types/symbol'

const PAPER = '#efe4cc'
const BORDER = '#3a2d1c'
const BADGE_BG = '#2a2013'
const ACCENT = '#8a6a3a'
const TEXT_DARK = '#2a2013'
const FOOTER_COL = '#7a5f36'

const PIN_COLORS: Record<string, string> = {
  green: '#16a34a',
  blue: '#2563eb',
  red: '#dc2626',
  black: '#111827',
}

const DIFF_LABELS: Record<string, string> = {
  green: 'Facile',
  blue: 'Intermédiaire',
  red: 'Difficile',
  black: 'Expert',
}

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  rrPath(ctx, x, y, w, h, r)
  ctx.fill()
  ctx.restore()
}

function badge(ctx: CanvasRenderingContext2D, x: number, y: number, value: string, label: string) {
  const W = 68, H = 56, R = 11
  fillRR(ctx, x, y, W, H, R, BADGE_BG)
  ctx.save()
  ctx.fillStyle = PAPER
  ctx.textAlign = 'center'
  ctx.font = '700 22px "Poppins", system-ui, sans-serif'
  ctx.fillText(value, x + W / 2, y + 32)
  ctx.font = '600 11px "Poppins", system-ui, sans-serif'
  ctx.fillStyle = '#c8b894'
  ctx.fillText(label, x + W / 2, y + H - 8)
  ctx.restore()
}

export type PosterInput = {
  mapBlob: Blob
  parkName: string
  region: string
  tracks: GpxTrack[]
  symbols: MapSymbol[]
  symbolDefs: SymbolDefinition[]
}

export async function composePoster(opts: PosterInput): Promise<Blob | null> {
  const img = await createImageBitmap(opts.mapBlob)

  const W = 1080
  const PAD = 26
  const INNER_W = W - 2 * PAD
  const FRAME_BORDER = 3
  const FRAME_RAD = 14

  const mapW = INNER_W
  const mapH = Math.min(Math.round(mapW * img.height / img.width), 920)

  const HEADER_H = 94
  const LEGEND_H = 60
  const FOOTER_H = 28
  const H = PAD + HEADER_H + 10 + mapH + 10 + LEGEND_H + 8 + FOOTER_H + 20

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Fond papier
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // ---- HEADER ----
  let y = PAD

  // Région (petite ligne au-dessus)
  if (opts.region) {
    ctx.save()
    ctx.fillStyle = ACCENT
    ctx.font = '600 11px "Poppins", system-ui, sans-serif'
    ctx.letterSpacing = '3px'
    ctx.fillText(opts.region.toUpperCase(), PAD, y + 15)
    ctx.restore()
  }

  // Nom du park
  ctx.save()
  ctx.fillStyle = TEXT_DARK
  ctx.font = '800 38px "Poppins", system-ui, sans-serif'
  const rawName = opts.parkName || 'Mon Bikepark'
  ctx.fillText(rawName.toUpperCase(), PAD, y + (opts.region ? 56 : 46))
  ctx.restore()

  // Badges stat (droite)
  const nbTracks = opts.tracks.length
  const nbLevels = new Set(opts.tracks.map(t => t.difficulty)).size
  const badgeY = y + 20

  if (nbTracks > 0) {
    badge(ctx, W - PAD - 68 * 2 - 10, badgeY, String(nbTracks), 'pistes')
  }
  if (nbLevels > 0) {
    badge(ctx, W - PAD - 68, badgeY, String(nbLevels), 'niveaux')
  }

  y += HEADER_H + 10

  // ---- MAP (image rounded clip + border) ----
  const frameX = PAD
  const frameY = y

  ctx.save()
  rrPath(ctx, frameX, frameY, mapW, mapH, FRAME_RAD)
  ctx.clip()
  ctx.drawImage(img, frameX, frameY, mapW, mapH)
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = BORDER
  ctx.lineWidth = FRAME_BORDER
  rrPath(ctx, frameX, frameY, mapW, mapH, FRAME_RAD)
  ctx.stroke()
  ctx.restore()

  y += mapH + 10

  // ---- LÉGENDE ----
  const DOT_R = 9
  const dotY = y + 32
  const diffOrder = ['green', 'blue', 'red', 'black'] as const
  const presentDiffs = diffOrder.filter(d => opts.tracks.some(t => t.difficulty === d))

  let lx = PAD
  ctx.save()
  for (const diff of presentDiffs) {
    // cercle
    ctx.beginPath()
    ctx.arc(lx + DOT_R, dotY, DOT_R, 0, Math.PI * 2)
    ctx.fillStyle = PIN_COLORS[diff]
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // label
    ctx.fillStyle = TEXT_DARK
    ctx.font = '700 14px "Poppins", system-ui, sans-serif'
    ctx.textAlign = 'left'
    const lbl = DIFF_LABELS[diff] ?? diff
    ctx.fillText(lbl, lx + DOT_R * 2 + 7, dotY + 5)
    lx += DOT_R * 2 + 7 + ctx.measureText(lbl).width + 20
  }
  ctx.restore()

  // Chips équipements (droite)
  const uniqueSymIds = [...new Set(opts.symbols.map(s => s.symbolId))]
  const symLabels = uniqueSymIds
    .map(id => opts.symbolDefs.find(d => d.id === id)?.label ?? id)
    .slice(0, 6)

  if (symLabels.length > 0) {
    ctx.save()
    let sx = W - PAD
    ctx.font = '600 11px "Poppins", system-ui, sans-serif'
    for (let i = symLabels.length - 1; i >= 0; i--) {
      const lbl = symLabels[i]
      const tw = ctx.measureText(lbl).width
      const chipW = tw + 18
      sx -= chipW + 6
      fillRR(ctx, sx, dotY - 14, chipW, 24, 6, 'rgba(42,32,19,0.1)')
      ctx.strokeStyle = 'rgba(42,32,19,0.2)'
      ctx.lineWidth = 1
      rrPath(ctx, sx, dotY - 14, chipW, 24, 6)
      ctx.stroke()
      ctx.fillStyle = TEXT_DARK
      ctx.textAlign = 'center'
      ctx.fillText(lbl, sx + chipW / 2, dotY + 3)
    }
    ctx.restore()
  }

  y += LEGEND_H + 8

  // ---- FOOTER ----
  ctx.save()
  ctx.fillStyle = FOOTER_COL
  ctx.font = '700 11px "Poppins", system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Carte générée avec PISTA · illustrator.pista.bike', PAD, y + 18)
  ctx.textAlign = 'right'
  ctx.fillText('© OpenStreetMap contributors · Mapterhorn', W - PAD, y + 18)
  ctx.restore()

  img.close()

  return new Promise<Blob | null>(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png')
  })
}
