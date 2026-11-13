// Génère une texture grain/papier en canvas (noise simple + variation tonale).
// Appliquée en globalCompositeOperation='multiply' à faible opacité pour l'effet écran-sérigraphie.

const TILE = 256

// PRNG déterministe (mulberry32) pour un grain reproductible.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = seed + 0x6d2b79f5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// Crée une tuile PNG 256×256 de grain papier et renvoie son dataURL.
export function createPaperTileUrl(opacity = 0.14): string {
  const canvas = document.createElement('canvas')
  canvas.width = TILE
  canvas.height = TILE
  const ctx = canvas.getContext('2d')!
  const rng = mulberry32(0xdeadbeef)

  const img = ctx.createImageData(TILE, TILE)
  const d = img.data

  for (let i = 0; i < d.length; i += 4) {
    // Grain bi-tonique : lumière douce (crème/ivoire) ou sombre (brun chaud) semi-aléatoire.
    // Probabilité 70% clair, 30% sombre → effet vieilli chaud.
    const v = rng()
    const dark = rng() < 0.30
    // Teintes papier chaud : crème #efe4cc (239,228,204) → brun #c9a87e (201,168,126)
    const r = dark ? 185 + Math.round(v * 20) : 240 + Math.round(v * 15)
    const g = dark ? 150 + Math.round(v * 20) : 220 + Math.round(v * 20)
    const b = dark ? 110 + Math.round(v * 15) : 180 + Math.round(v * 20)
    const a = Math.round(opacity * 255 * (0.4 + v * 0.6)) // opacité variable par pixel
    d[i] = r
    d[i + 1] = g
    d[i + 2] = b
    d[i + 3] = a
  }

  ctx.putImageData(img, 0, 0)

  // Ajout d'un léger voile de vieillissement (gradient radial très discret)
  const grad = ctx.createRadialGradient(TILE / 2, TILE / 2, 0, TILE / 2, TILE / 2, TILE * 0.65)
  grad.addColorStop(0, 'rgba(255,240,200,0.0)')
  grad.addColorStop(1, 'rgba(180,130,80,0.06)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, TILE, TILE)

  return canvas.toDataURL('image/png')
}

// Lazy singleton — calculé une seule fois à l'import.
let _tileUrl: string | null = null
export function getPaperTileUrl(): string {
  if (!_tileUrl) _tileUrl = createPaperTileUrl(0.14)
  return _tileUrl
}

// Applique la texture grain sur un CanvasRenderingContext2D (poster compose).
// Paramètre strength : 0–1 (défaut 0.22 → subtil mais visible print).
export async function applyPaperGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength = 0.22,
): Promise<void> {
  const tileUrl = getPaperTileUrl()
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const el = new Image()
    el.onload = () => res(el)
    el.onerror = rej
    el.src = tileUrl
  })

  ctx.save()
  ctx.globalAlpha = strength
  ctx.globalCompositeOperation = 'multiply'
  // Tile manuellement sur toute la surface.
  for (let y = 0; y < height; y += TILE) {
    for (let x = 0; x < width; x += TILE) {
      ctx.drawImage(img, x, y, TILE, TILE)
    }
  }
  ctx.restore()
}
