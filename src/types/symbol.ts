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

// Jeu de "logos" illustrés — glyphes pleins (fill=currentColor, teinté en sombre par le badge),
// cohérents en style. Deux familles : FEATURES de piste (départ/jump/drop/berm/rock/view) et
// ÉQUIPEMENTS du park (parking, remontée, navette, eau, resto, WC, secours, table, pump track,
// atelier, accueil, boutique). Les 6 ids d'origine sont conservés (compat projets existants).
export const defaultSymbolLibrary: SymbolDefinition[] = [
  // ---- Features de piste ----
  {
    id: 'start',
    kind: 'default',
    label: 'Depart',
    color: '#22c55e',
    description: 'Point de depart ou entree de piste.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 2a1.15 1.15 0 0 1 1.15 1.15V21a1.15 1.15 0 0 1-2.3 0V3.15A1.15 1.15 0 0 1 6 2Z" />
        <path d="M8 3.5h11.3a.6.6 0 0 1 .46 1l-2.9 3.35 2.9 3.35a.6.6 0 0 1-.46 1H8V3.5Z" />
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
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M2 18C9.5 18 13 12 22 6.5l1 1.9C14.5 14 11.5 20 2 20V18Z" />
        <path d="M2 20.2h20V22.4H2z" />
        <circle cx="19.5" cy="4.6" r="1.8" />
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
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M2.5 5.5h8.5V8H5v12H2.5z" />
        <path d="M15.8 4h2.7v8.2H22l-4.85 6.3L12.3 12.2h3.5z" />
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 17c5.5 0 5.5-9.5 12.5-9.5 2.8 0 4.6 1.3 5.5 3.2" />
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
        <path d="M9 3.5 14.5 2.5 20 6.5 18.8 14 12 18.5 5 14.7 3.7 8z" />
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
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3.4 14.45 8.4 20 9.2l-4 3.9.95 5.5L12 15.9 7.05 18.6 8 13.1 4 9.2l5.55-.8z" />
      </svg>
    `,
  },
  // ---- Equipements du park ----
  {
    id: 'parking',
    kind: 'default',
    label: 'Parking',
    color: '#2563eb',
    description: 'Parking.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.5 3.5h6.6a5.2 5.2 0 0 1 0 10.4H9.8V20.5H6.5V3.5Zm3.3 3.1v4.2h3.1a2.1 2.1 0 0 0 0-4.2H9.8Z" />
      </svg>
    `,
  },
  {
    id: 'lift',
    kind: 'default',
    label: 'Remontee',
    color: '#0ea5e9',
    description: 'Remontee mecanique / telesiege.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M2 4.2h20v2H2z" />
        <circle cx="8.5" cy="5.2" r="2" />
        <path d="M8.5 7v2.4" fill="none" stroke="currentColor" stroke-width="1.6" />
        <path d="M5.2 9.4h8.4a1 1 0 0 1 1 1v4.2a1 1 0 0 1-1 1H5.2a1 1 0 0 1-1-1v-4.2a1 1 0 0 1 1-1Z" />
      </svg>
    `,
  },
  {
    id: 'shuttle',
    kind: 'default',
    label: 'Navette',
    color: '#0891b2',
    description: 'Navette / bus uplift.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 6.4A2 2 0 0 1 5 4.4h10.3l5.2 5.2v5.6a1 1 0 0 1-1 1H18a2.9 2.9 0 0 1-5.8 0H9.3a2.9 2.9 0 0 1-5.8 0H4a1 1 0 0 1-1-1V6.4Zm2.2 1v3.9h7.1V7.4H5.2Zm9.2 0v3.9h4.6l-3.5-3.9h-1.1Z" />
        <circle cx="6.4" cy="17" r="1.7" />
        <circle cx="15.1" cy="17" r="1.7" />
      </svg>
    `,
  },
  {
    id: 'water',
    kind: 'default',
    label: 'Point d eau',
    color: '#06b6d4',
    description: 'Point d eau / fontaine.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.3s6.6 7.2 6.6 11.6A6.6 6.6 0 1 1 5.4 13.9C5.4 9.5 12 2.3 12 2.3Z" />
      </svg>
    `,
  },
  {
    id: 'food',
    kind: 'default',
    label: 'Restauration',
    color: '#f59e0b',
    description: 'Restauration / buvette.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 2.2v6.6a2.6 2.6 0 0 0 1.9 2.5V22h2V11.3a2.6 2.6 0 0 0 1.9-2.5V2.2h-1.5v5.9H9.6V2.2H8.3v5.9H7.5V2.2H6Z" />
        <path d="M16.8 2.2c-1.9 0-3.1 2.6-3.1 6.2 0 2.7 1.1 4.3 2.4 4.8V22h2V2.2h-1.3Z" />
      </svg>
    `,
  },
  {
    id: 'wc',
    kind: 'default',
    label: 'Toilettes',
    color: '#64748b',
    description: 'Toilettes.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="7" cy="3.8" r="2.1" />
        <path d="M4.7 7.4h4.6l1.5 5.4H9.1V21H5V12.8H3.2z" />
        <circle cx="17" cy="3.8" r="2.1" />
        <path d="M14.6 7.4h4.8l1.6 5.4h-1.7V21h-1.5v-4.4h-1V21H14.9v-8.2h-1.9z" />
        <path d="M12 3v18" stroke="currentColor" stroke-width="1" />
      </svg>
    `,
  },
  {
    id: 'firstaid',
    kind: 'default',
    label: 'Secours',
    color: '#dc2626',
    description: 'Premiers secours.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="4.2" />
        <path d="M10.1 6.8h3.8v3.3h3.3v3.8h-3.3v3.3h-3.8v-3.3H6.8v-3.8h3.3z" fill="#ffffff" />
      </svg>
    `,
  },
  {
    id: 'picnic',
    kind: 'default',
    label: 'Table',
    color: '#16a34a',
    description: 'Table de pique-nique / aire de repos.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M2 8.6h20v2.2H2z" />
        <path d="M4.6 10.8 2.6 20h2.2l1.2-5.6h11.9L19.2 20h2.2l-2-9.2h-2.2l.5 2.3H6.3l.5-2.3z" />
      </svg>
    `,
  },
  {
    id: 'pumptrack',
    kind: 'default',
    label: 'Pump track',
    color: '#8b5cf6',
    description: 'Pump track / zone de roulage.',
    svg: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 15c2.6 0 3-5.5 6-5.5S11.4 15 14 15s3-5.5 6-5.5" />
      </svg>
    `,
  },
  {
    id: 'repair',
    kind: 'default',
    label: 'Atelier',
    color: '#475569',
    description: 'Atelier / reparation velo.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.9 5.5a5.1 5.1 0 0 1-6.6 6.6l-7.8 7.8a2 2 0 0 1-2.9-2.9l7.8-7.8A5.1 5.1 0 0 1 18 2.6l-2.9 2.9 1.5 1.5L19.5 4.1z" />
      </svg>
    `,
  },
  {
    id: 'info',
    kind: 'default',
    label: 'Accueil',
    color: '#0284c7',
    description: 'Accueil / point info.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="9.2" />
        <circle cx="12" cy="7.8" r="1.5" fill="#ffffff" />
        <path d="M10.5 10.8h3v6.6h-3z" fill="#ffffff" />
      </svg>
    `,
  },
  {
    id: 'shop',
    kind: 'default',
    label: 'Boutique',
    color: '#d946ef',
    description: 'Boutique / location.',
    svg: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 7.2V6a4 4 0 0 1 8 0v1.2h3.1l1.1 13.3H3.8L4.9 7.2H8Zm2.1 0h3.8V6a1.9 1.9 0 0 0-3.8 0v1.2Z" />
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
