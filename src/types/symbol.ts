export type DefaultSymbolType = 'start' | 'jump' | 'drop' | 'berm' | 'rock' | 'view'
export type SymbolId = string

export type SymbolDefinition = {
  id: SymbolId
  kind: 'default' | 'custom'
  label: string
  color: string
  description: string
  svg: string
}

export type MapSymbol = {
  id: string
  symbolId: SymbolId
  lngLat: [number, number]
  iconSize: number
  rotation: number
  flipX: boolean
  flipY: boolean
}

export type UploadedSymbolPayload = {
  label: string
  svg: string
}

export const defaultSymbolLibrary: SymbolDefinition[] = [
  {
    id: 'start',
    kind: 'default',
    label: 'Depart',
    color: '#22c55e',
    description: 'Point de depart ou entree de piste.',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3v18" />
        <path d="M12 4h7l-2.5 3L19 10h-7" />
      </svg>
    `,
  },
  {
    id: 'jump',
    kind: 'default',
    label: 'Jump',
    color: '#f97316',
    description: 'Saut, table ou module aerien.',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 16h4l3-7 3 7h6" />
        <path d="M10.5 9H13" />
      </svg>
    `,
  },
  {
    id: 'drop',
    kind: 'default',
    label: 'Drop',
    color: '#ef4444',
    description: 'Drop ou marche franche.',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 7h8" />
        <path d="M13 7v6" />
        <path d="M13 13l3-3" />
        <path d="M13 13l-3-3" />
        <path d="M13 19v-6" />
      </svg>
    `,
  },
  {
    id: 'berm',
    kind: 'default',
    label: 'Berm',
    color: '#3b82f6',
    description: 'Virage releve ou appui marque.',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 16c3.5 0 4-8 10-8 2 0 3.3.8 4 2" />
        <path d="M8 19c3 0 4.2-2 6.4-4.2" />
      </svg>
    `,
  },
  {
    id: 'rock',
    kind: 'default',
    label: 'Rock',
    color: '#6b7280',
    description: 'Section rocheuse ou technique.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8.2 5.4 14 4l4.8 4.2-1.1 7L11.8 20 6 16.3 4.8 9.4 8.2 5.4Z" />
      </svg>
    `,
  },
  {
    id: 'view',
    kind: 'default',
    label: 'Spot',
    color: '#a855f7',
    description: 'Point de vue, photo ou repere visuel.',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 5.5 13.7 9l3.8.6-2.8 2.7.7 3.7L12 14.2 8.6 16l.7-3.7-2.8-2.7 3.8-.6L12 5.5Z" />
      </svg>
    `,
  },
]

export function sanitizeUploadedSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .trim()
}

export function buildCustomSymbolDefinition(id: string, payload: UploadedSymbolPayload): SymbolDefinition {
  return {
    id,
    kind: 'custom',
    label: payload.label,
    color: '#e2e8f0',
    description: 'Symbole utilisateur importe.',
    svg: sanitizeUploadedSvg(payload.svg),
  }
}

export function getSymbolDefinition(
  symbolId: SymbolId,
  customSymbols: SymbolDefinition[] = [],
): SymbolDefinition {
  return (
    customSymbols.find((symbol) => symbol.id === symbolId) ??
    defaultSymbolLibrary.find((symbol) => symbol.id === symbolId) ??
    defaultSymbolLibrary[0]
  )
}

export function getSymbolSvg(symbolId: SymbolId, customSymbols: SymbolDefinition[] = []): string {
  return getSymbolDefinition(symbolId, customSymbols).svg
}
