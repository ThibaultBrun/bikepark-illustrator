// Génère un panneau de légende autonome (PNG) pour affichage en entrée de park.
import type { GpxTrack } from '../types/gpx'
import type { MapSymbol, SymbolDefinition } from '../types/symbol'
import { applyPaperGrain } from './paperTexture'

const PAPER = '#efe4cc'
const BORDER = '#3a2d1c'
const TEXT_DARK = '#2a2013'
const TEXT_MID = '#7a5f36'
const DISPLAY_FONT = '"Barlow Condensed", "Inter", system-ui, sans-serif'

const PIN_COLORS: Record<string, string> = {
  green: '#16a34a',
  blue: '#2563eb',
  red: '#dc2626',
  black: '#111827',
}

const DIFF_LABELS: Record<string, Record<string, string>> = {
  fr: { green: 'Facile', blue: 'Intermédiaire', red: 'Difficile', black: 'Expert' },
  en: { green: 'Easy', blue: 'Intermediate', red: 'Hard', black: 'Expert' },
  es: { green: 'Fácil', blue: 'Intermedio', red: 'Difícil', black: 'Experto' },
  eu: { green: 'Erraza', blue: 'Ertaina', red: 'Zaila', black: 'Aditua' },
}

const SECTION_HEADERS: Record<string, { diff: string; equip: string }> = {
  fr: { diff: 'DIFFICULTÉS', equip: 'ÉQUIPEMENTS' },
  en: { diff: 'DIFFICULTY', equip: 'FACILITIES' },
  es: { diff: 'DIFICULTADES', equip: 'INSTALACIONES' },
  eu: { diff: 'ZAILTASUNA', equip: 'INSTALAZIOAK' },
}

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function fillRR(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  color: string,
) {
  ctx.save()
  ctx.fillStyle = color
  rrPath(ctx, x, y, w, h, r)
  ctx.fill()
  ctx.restore()
}

export type LegendInput = {
  parkName: string
  region?: string
  tracks: GpxTrack[]
  symbols: MapSymbol[]
  symbolDefs: SymbolDefinition[]
  locale?: string
  accentColor?: string
  logoDataUrl?: string
}

export async function composeLegend(opts: LegendInput): Promise<Blob | null> {
  try {
    await Promise.all([
      document.fonts.load(`800 32px "Barlow Condensed"`),
      document.fonts.load(`700 20px "Barlow Condensed"`),
      document.fonts.load(`600 11px "Barlow Condensed"`),
    ])
  } catch { /* non-fatal */ }

  const W = 1600
  const H = 480
  const PAD = 36
  const DIVIDER_X = 340

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Fond papier
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // Cadre
  ctx.save()
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 3
  rrPath(ctx, 2, 2, W - 4, H - 4, 18)
  ctx.stroke()
  ctx.restore()

  // Bande accent en haut
  const accentCol = opts.accentColor ?? '#c8a050'
  fillRR(ctx, 2, 2, W - 4, 10, 18, accentCol)

  // --- BLOC GAUCHE : identité du park ---
  let topY = PAD + 24

  if (opts.logoDataUrl) {
    try {
      const logoImg = await new Promise<HTMLImageElement>((res, rej) => {
        const el = new Image()
        el.onload = () => res(el)
        el.onerror = rej
        el.src = opts.logoDataUrl!
      })
      const sz = 60
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(PAD, topY, sz, sz, 10)
      ctx.clip()
      const lr = logoImg.width / logoImg.height
      let lsx = 0, lsy = 0, lsw = logoImg.width, lsh = logoImg.height
      if (lr > 1) { lsw = logoImg.height; lsx = (logoImg.width - lsw) / 2 }
      else { lsh = logoImg.width; lsy = (logoImg.height - lsh) / 2 }
      ctx.drawImage(logoImg, lsx, lsy, lsw, lsh, PAD, topY, sz, sz)
      ctx.restore()
      topY += sz + 12
    } catch { /* logo invalide → ignoré */ }
  }

  if (opts.region) {
    ctx.save()
    ctx.fillStyle = accentCol
    ctx.font = `600 11px ${DISPLAY_FONT}`
    ctx.letterSpacing = '3px'
    ctx.textAlign = 'left'
    ctx.fillText(opts.region.toUpperCase(), PAD, topY + 14)
    ctx.restore()
    topY += 20
  }

  ctx.save()
  ctx.fillStyle = TEXT_DARK
  ctx.font = `800 34px ${DISPLAY_FONT}`
  ctx.textAlign = 'left'
  ctx.fillText((opts.parkName || 'Mon Bikepark').toUpperCase(), PAD, topY + 38)
  ctx.restore()

  // Séparateur vertical
  ctx.save()
  ctx.strokeStyle = 'rgba(58,45,28,0.2)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(DIVIDER_X, PAD + 16)
  ctx.lineTo(DIVIDER_X, H - PAD - 16)
  ctx.stroke()
  ctx.restore()

  // --- SECTION DROITE ---
  const locale = opts.locale ?? 'fr'
  const labels = DIFF_LABELS[locale] ?? DIFF_LABELS.fr
  const headers = SECTION_HEADERS[locale] ?? SECTION_HEADERS.fr

  const SX = DIVIDER_X + 32  // X de départ section droite

  // Header "DIFFICULTÉS"
  ctx.save()
  ctx.fillStyle = TEXT_MID
  ctx.font = `600 11px ${DISPLAY_FONT}`
  ctx.letterSpacing = '3px'
  ctx.textAlign = 'left'
  ctx.fillText(headers.diff, SX, PAD + 38)
  ctx.restore()

  const diffOrder = ['green', 'blue', 'red', 'black'] as const
  const presentDiffs = diffOrder.filter(d => opts.tracks.some(t => t.difficulty === d))

  const DOT_R = 17
  const dotCenterY = PAD + 90
  const COL_W = 196

  for (let i = 0; i < presentDiffs.length; i++) {
    const diff = presentDiffs[i]
    const dx = SX + i * COL_W

    ctx.save()
    ctx.beginPath()
    ctx.arc(dx + DOT_R, dotCenterY, DOT_R, 0, Math.PI * 2)
    ctx.fillStyle = PIN_COLORS[diff]
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.fillStyle = TEXT_DARK
    ctx.font = `700 20px ${DISPLAY_FONT}`
    ctx.textAlign = 'left'
    ctx.fillText(labels[diff] ?? diff, dx + DOT_R * 2 + 10, dotCenterY + 7)
    ctx.restore()
  }

  // --- ÉQUIPEMENTS ---
  const uniqueSymIds = [...new Set(opts.symbols.map(s => s.symbolId))]
  const symLabels = uniqueSymIds
    .map(id => opts.symbolDefs.find(d => d.id === id)?.label ?? id)
    .slice(0, 12)

  if (symLabels.length > 0) {
    ctx.save()
    ctx.fillStyle = TEXT_MID
    ctx.font = `600 11px ${DISPLAY_FONT}`
    ctx.letterSpacing = '3px'
    ctx.textAlign = 'left'
    ctx.fillText(headers.equip, SX, dotCenterY + 54)
    ctx.restore()

    ctx.save()
    ctx.font = `600 13px ${DISPLAY_FONT}`
    ctx.letterSpacing = '0px'
    let chipX = SX
    const chipY = dotCenterY + 68

    for (const lbl of symLabels) {
      const tw = ctx.measureText(lbl).width
      const chipW = tw + 22
      if (chipX + chipW > W - PAD) break
      fillRR(ctx, chipX, chipY, chipW, 30, 7, 'rgba(42,32,19,0.07)')
      ctx.save()
      ctx.strokeStyle = 'rgba(42,32,19,0.18)'
      ctx.lineWidth = 1
      rrPath(ctx, chipX, chipY, chipW, 30, 7)
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = TEXT_DARK
      ctx.textAlign = 'center'
      ctx.fillText(lbl, chipX + chipW / 2, chipY + 20)
      chipX += chipW + 8
    }
    ctx.restore()
  }

  // Footer
  ctx.save()
  ctx.strokeStyle = 'rgba(58,45,28,0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, H - 48)
  ctx.lineTo(W - PAD, H - 48)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.fillStyle = TEXT_MID
  ctx.font = `600 13px ${DISPLAY_FONT}`
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
  ctx.fillText('pista.bike — Bikepark Illustrator', PAD, H - 22)
  ctx.textAlign = 'right'
  ctx.fillText(String(new Date().getFullYear()), W - PAD, H - 22)
  ctx.restore()

  // Grain papier
  await applyPaperGrain(ctx, W, H, 0.18)

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png')
  })
}
