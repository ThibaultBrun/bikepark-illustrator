// Compositeur poster illustré : map blob → canvas avec titre, légende, crédit.
import type { GpxTrack } from '../types/gpx'
import type { MapSymbol, SymbolDefinition } from '../types/symbol'
import { applyPaperGrain } from './paperTexture'
import type { PrintFormatId } from './printFormats'
import { getFormatById, getCanvasSize } from './printFormats'

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
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

const DISPLAY_FONT = '"Barlow Condensed", "Inter", system-ui, sans-serif'

function badge(ctx: CanvasRenderingContext2D, x: number, y: number, value: string, label: string) {
  const W = 68, H = 56, R = 11
  fillRR(ctx, x, y, W, H, R, BADGE_BG)
  ctx.save()
  ctx.fillStyle = PAPER
  ctx.textAlign = 'center'
  ctx.font = `700 22px ${DISPLAY_FONT}`
  ctx.fillText(value, x + W / 2, y + 32)
  ctx.font = `600 11px ${DISPLAY_FONT}`
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
  formatId?: PrintFormatId
  accentColor?: string
  logoDataUrl?: string
}

export async function composePoster(opts: PosterInput): Promise<Blob | null> {
  // Ensure display font is loaded before canvas draw (critical for consistent output)
  try {
    await Promise.all([
      document.fonts.load(`800 40px "Barlow Condensed"`),
      document.fonts.load(`700 20px "Barlow Condensed"`),
      document.fonts.load(`600 12px "Barlow Condensed"`),
    ])
  } catch { /* font load errors are non-fatal */ }

  const fmt = getFormatById(opts.formatId ?? 'a4p')
  const { w: W, h: H } = getCanvasSize(fmt)
  const isLandscape = fmt.rw > fmt.rh
  const PAD = isLandscape ? 20 : 26
  const INNER_W = W - 2 * PAD
  const FRAME_BORDER = 3
  const FRAME_RAD = 14
  const ACCENT_OVERRIDE = opts.accentColor || null

  const HEADER_H = isLandscape ? 60 : 94
  const LEGEND_H = isLandscape ? 48 : 60
  const FOOTER_H = isLandscape ? 20 : 28
  const mapReserved = PAD + HEADER_H + 10 + 10 + LEGEND_H + 8 + FOOTER_H + 20
  const mapW = INNER_W
  const mapH = H - mapReserved

  const img = await createImageBitmap(opts.mapBlob)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Fond papier
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // ---- HEADER ----
  let y = PAD

  const accentCol = ACCENT_OVERRIDE ?? ACCENT

  // Logo parc (optionnel) — carré arrondi en haut à gauche, avant le nom
  let logoDrawnWidth = 0
  if (opts.logoDataUrl) {
    try {
      const logoImg = await loadImage(opts.logoDataUrl)
      const logoSz = isLandscape ? 46 : 60
      const logoX = PAD
      const logoY = y
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(logoX, logoY, logoSz, logoSz, 10)
      ctx.clip()
      // cover-fit carré
      const lr = logoImg.width / logoImg.height
      let lsx = 0, lsy = 0, lsw = logoImg.width, lsh = logoImg.height
      if (lr > 1) { lsw = logoImg.height; lsx = (logoImg.width - lsw) / 2 }
      else { lsh = logoImg.width; lsy = (logoImg.height - lsh) / 2 }
      ctx.drawImage(logoImg, lsx, lsy, lsw, lsh, logoX, logoY, logoSz, logoSz)
      ctx.restore()
      logoDrawnWidth = logoSz + 12
    } catch { /* logo invalide → on ignore */ }
  }

  const headerX = PAD + logoDrawnWidth

  // Région (petite ligne au-dessus)
  if (opts.region && !isLandscape) {
    ctx.save()
    ctx.fillStyle = accentCol
    ctx.font = `600 11px ${DISPLAY_FONT}`
    ctx.letterSpacing = '3px'
    ctx.fillText(opts.region.toUpperCase(), headerX, y + 15)
    ctx.restore()
  }

  // Nom du park
  ctx.save()
  ctx.fillStyle = TEXT_DARK
  const nameSize = isLandscape ? 26 : 38
  ctx.font = `800 ${nameSize}px ${DISPLAY_FONT}`
  const rawName = opts.parkName || 'Mon Bikepark'
  const nameY = isLandscape ? y + 38 : y + (opts.region ? 56 : 46)
  ctx.fillText(rawName.toUpperCase(), headerX, nameY)
  ctx.restore()

  // Région inline (paysage)
  if (opts.region && isLandscape) {
    ctx.save()
    ctx.fillStyle = accentCol
    ctx.font = `600 10px ${DISPLAY_FONT}`
    ctx.letterSpacing = '2px'
    ctx.fillText(opts.region.toUpperCase(), headerX, nameY - nameSize - 4)
    ctx.restore()
  }

  // Badges stat (droite)
  const nbTracks = opts.tracks.length
  const nbLevels = new Set(opts.tracks.map(t => t.difficulty)).size
  const badgeY = isLandscape ? y + 8 : y + 20

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

  // Cover-crop : remplir le cadre sans distorsion
  const imgAspect = img.width / img.height
  const frameAspect = mapW / mapH
  let sx = 0, sy = 0, sw = img.width, sh = img.height
  if (imgAspect > frameAspect) {
    sw = Math.round(img.height * frameAspect)
    sx = Math.round((img.width - sw) / 2)
  } else {
    sh = Math.round(img.width / frameAspect)
    sy = Math.round((img.height - sh) / 2)
  }

  ctx.save()
  rrPath(ctx, frameX, frameY, mapW, mapH, FRAME_RAD)
  ctx.clip()
  ctx.drawImage(img, sx, sy, sw, sh, frameX, frameY, mapW, mapH)
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
    ctx.font = `700 14px ${DISPLAY_FONT}`
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
    ctx.font = `600 11px ${DISPLAY_FONT}`
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
  ctx.font = `700 11px ${DISPLAY_FONT}`
  ctx.textAlign = 'left'
  ctx.fillText('Carte générée avec PISTA · illustrator.pista.bike', PAD, y + 18)
  ctx.textAlign = 'right'
  ctx.fillText('© OpenStreetMap contributors · Mapterhorn', W - PAD, y + 18)
  ctx.restore()

  img.close()

  // Texture grain papier en multiply — donne un toucher sérigraphie/print chaud.
  await applyPaperGrain(ctx, W, H, 0.22)

  return new Promise<Blob | null>(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png')
  })
}
