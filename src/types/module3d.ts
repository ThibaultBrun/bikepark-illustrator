export type Module3DType = 'jump' | 'double' | 'table' | 'berm' | 'pumptrack' | 'northshore'

export type Module3D = {
  id: string
  type: Module3DType
  lngLat: [number, number]
  rotation: number
  scale: number
}

export const MODULE3D_LABELS: Record<Module3DType, string> = {
  jump: 'Saut',
  double: 'Double',
  table: 'Table',
  berm: 'Berm',
  pumptrack: 'Pump Track',
  northshore: 'North Shore',
}

// Palette commune
// Lumière: NW (haut-gauche). Ombre: SE (bas-droite).
// Faces lit (NW): +40% brightness. Faces shadow (SE): -40%.
// Golden hour highlight edge: #E8C050. Shadow ground: rgba(30,42,90,0.22).
const D_LIT = '#D0A85A'   // dirt lit
const D_MID = '#A07840'   // dirt mid
const D_SHD = '#6B4820'   // dirt shadow
const W_LIT = '#C8982A'   // wood lit
const W_MID = '#8B6514'   // wood mid
const W_SHD = '#4E3208'   // wood shadow
const W_PLANK = '#B08020' // wood plank mid
const GOLD = '#E8C050'    // golden hour edge
const SHAD = 'rgba(30,42,90,0.22)' // ground shadow

// Sprites iso 2.5D. ViewBox 100×70. Viewer vient du SW (bas-gauche).
// Lumière NW = face gauche/haut lit, face droite/bas shadow.
// Ombre au sol décalée SE (bas-droite).
export const MODULE3D_SVG: Record<Module3DType, string> = {
  // ── JUMP : rampe kicker, montée sud→nord ──────────────────────────────
  jump: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <!-- shadow -->
  <ellipse cx="52" cy="63" rx="34" ry="7" fill="${SHAD}"/>
  <!-- Left face lit (NW) -->
  <path d="M 18,58 L 32,58 L 44,22 L 28,24 Z" fill="${D_LIT}"/>
  <!-- Ramp surface (main face, mid-tone) -->
  <path d="M 32,58 L 72,60 L 62,22 L 44,22 Z" fill="${D_MID}"/>
  <!-- Right face shadow (NE) -->
  <path d="M 72,60 L 72,56 L 64,20 L 62,22 Z" fill="${D_SHD}"/>
  <!-- Base front strip -->
  <path d="M 18,58 L 72,60 L 72,64 L 18,62 Z" fill="${D_SHD}"/>
  <!-- Lip highlight -->
  <path d="M 28,24 L 64,20" stroke="${GOLD}" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>
  <!-- Curved lip underside -->
  <path d="M 28,24 Q 46,19 64,20" stroke="${D_LIT}" stroke-width="1.2" fill="none" opacity="0.5"/>
</svg>`,

  // ── DOUBLE : deux rampes / gap jump ──────────────────────────────────
  double: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <!-- shadow -->
  <ellipse cx="50" cy="64" rx="40" ry="7" fill="${SHAD}"/>
  <!-- Kicker 1 (left) -->
  <path d="M 6,58 L 18,58 L 26,26 L 12,28 Z" fill="${D_LIT}"/>
  <path d="M 18,58 L 38,60 L 32,26 L 26,26 Z" fill="${D_MID}"/>
  <path d="M 38,60 L 38,56 L 33,24 L 32,26 Z" fill="${D_SHD}"/>
  <path d="M 6,58 L 38,60 L 38,63 L 6,61 Z" fill="${D_SHD}"/>
  <path d="M 12,28 L 33,24" stroke="${GOLD}" stroke-width="1.9" stroke-linecap="round" opacity="0.8"/>
  <!-- Gap (ground) -->
  <path d="M 38,62 L 62,62 L 62,65 L 38,65 Z" fill="${D_MID}" opacity="0.4"/>
  <!-- Kicker 2 (right) mirror: facing opponent → flipped, faces viewer from right -->
  <path d="M 62,60 L 82,58 L 88,58 L 74,28 Z" fill="${D_LIT}"/>
  <path d="M 62,60 L 68,26 L 74,28 L 82,58 Z" fill="${D_MID}"/>
  <path d="M 62,56 L 62,60 L 67,24 L 68,26 Z" fill="${D_SHD}"/>
  <path d="M 62,60 L 94,58 L 94,63 L 62,63 Z" fill="${D_SHD}"/>
  <path d="M 67,24 L 88,28" stroke="${GOLD}" stroke-width="1.9" stroke-linecap="round" opacity="0.8"/>
</svg>`,

  // ── TABLE : table top ─────────────────────────────────────────────────
  table: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <!-- shadow -->
  <ellipse cx="52" cy="64" rx="38" ry="7" fill="${SHAD}"/>
  <!-- Left face lit -->
  <path d="M 10,58 L 24,58 L 30,32 L 14,34 Z" fill="${D_LIT}"/>
  <!-- Ramp-in face -->
  <path d="M 24,58 L 38,60 L 36,32 L 30,32 Z" fill="${D_MID}"/>
  <!-- Flat table top (horizontal, lit by sky) -->
  <path d="M 30,32 L 36,32 L 60,30 L 56,30 Z" fill="${D_LIT}"/>
  <!-- Table top wider surface -->
  <path d="M 14,34 L 30,32 L 56,30 L 42,32 Z" fill="${D_LIT}" opacity="0.85"/>
  <!-- Ramp-out face -->
  <path d="M 60,30 L 78,32 L 86,58 L 70,56 Z" fill="${D_MID}"/>
  <!-- Right face shadow -->
  <path d="M 78,32 L 86,58 L 90,58 L 82,32 Z" fill="${D_SHD}"/>
  <!-- Base strip -->
  <path d="M 10,58 L 90,58 L 90,63 L 10,63 Z" fill="${D_SHD}"/>
  <!-- Flat top highlight edges -->
  <path d="M 14,34 L 42,32 L 56,30 L 30,32 Z" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linejoin="round" opacity="0.7"/>
</svg>`,

  // ── BERM : virage relevé ──────────────────────────────────────────────
  berm: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <!-- shadow -->
  <ellipse cx="50" cy="64" rx="40" ry="6" fill="${SHAD}"/>
  <!-- Outer bank (low, ground level) -->
  <path d="M 12,58 Q 50,54 88,56 Q 88,62 50,64 Q 12,62 12,58 Z" fill="${D_MID}"/>
  <!-- Inner raised bank (the berm wall, lit) -->
  <path d="M 22,46 Q 50,36 78,44 Q 78,50 50,42 Q 22,52 22,46 Z" fill="${D_LIT}"/>
  <!-- The berm surface (the tilted riding surface, connecting inner/outer) -->
  <path d="M 12,58 Q 50,54 88,56 L 78,44 Q 50,36 22,46 Z" fill="${D_MID}" opacity="0.9"/>
  <!-- Inner wall shadow strip (shaded inner face, far from viewer) -->
  <path d="M 22,46 Q 50,38 78,44 L 76,40 Q 50,32 24,42 Z" fill="${D_SHD}" opacity="0.75"/>
  <!-- Inner edge lip highlight -->
  <path d="M 22,46 Q 50,36 78,44" stroke="${GOLD}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.8"/>
  <!-- Left side face (lit, entering the berm) -->
  <path d="M 12,58 L 12,52 L 22,46 L 22,52 Z" fill="${D_LIT}" opacity="0.7"/>
  <!-- Right side face (shadow) -->
  <path d="M 88,56 L 88,50 L 78,44 L 78,50 Z" fill="${D_SHD}" opacity="0.7"/>
</svg>`,

  // ── PUMPTRACK : série de rollers ──────────────────────────────────────
  pumptrack: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <!-- shadow -->
  <ellipse cx="50" cy="64" rx="40" ry="6" fill="${SHAD}"/>
  <!-- Track base strip -->
  <path d="M 8,60 Q 50,56 92,58 L 92,64 Q 50,62 8,66 Z" fill="${D_SHD}" opacity="0.6"/>
  <!-- Roller 1 (left) -->
  <path d="M 12,58 Q 22,46 32,58 L 32,62 Q 22,52 12,62 Z" fill="${D_MID}"/>
  <path d="M 12,58 Q 14,50 22,46" stroke="${D_LIT}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 22,46 Q 30,50 32,58" stroke="${D_SHD}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M 20,47 L 24,47" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>
  <!-- Roller 2 (center) -->
  <path d="M 34,57 Q 44,44 54,57 L 54,61 Q 44,50 34,61 Z" fill="${D_MID}"/>
  <path d="M 34,57 Q 36,48 44,44" stroke="${D_LIT}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 44,44 Q 52,48 54,57" stroke="${D_SHD}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M 42,45 L 46,44" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>
  <!-- Roller 3 (right) -->
  <path d="M 56,58 Q 66,46 76,58 L 76,62 Q 66,52 56,62 Z" fill="${D_MID}"/>
  <path d="M 56,58 Q 58,50 66,46" stroke="${D_LIT}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 66,46 Q 74,50 76,58" stroke="${D_SHD}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M 64,47 L 68,46" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>
  <!-- Landing after last roller -->
  <path d="M 76,58 Q 84,56 92,58" stroke="${D_MID}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`,

  // ── NORTHSHORE : passerelle en lattes de bois ─────────────────────────
  northshore: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <!-- shadow -->
  <ellipse cx="50" cy="66" rx="38" ry="5" fill="${SHAD}"/>
  <!-- Support posts (3) -->
  <rect x="16" y="42" width="5" height="20" rx="1.5" fill="${W_SHD}"/>
  <rect x="47" y="40" width="5" height="22" rx="1.5" fill="${W_SHD}"/>
  <rect x="78" y="42" width="5" height="20" rx="1.5" fill="${W_SHD}"/>
  <!-- Cross-beam (structural) -->
  <path d="M 14,50 L 86,50" stroke="${W_MID}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
  <!-- Plank top-south face (front face of deck, faces viewer) -->
  <path d="M 10,38 L 90,38 L 90,43 L 10,43 Z" fill="${W_MID}"/>
  <!-- Individual planks (top surface) with gaps between them -->
  <path d="M 10,20 L 90,20 L 90,38 L 10,38 Z" fill="${W_LIT}"/>
  <!-- Plank gap lines (planks run E-W, gaps show as horizontal dark lines) -->
  <line x1="10" y1="24" x2="90" y2="24" stroke="${W_SHD}" stroke-width="1.3" opacity="0.6"/>
  <line x1="10" y1="28" x2="90" y2="28" stroke="${W_SHD}" stroke-width="1.3" opacity="0.6"/>
  <line x1="10" y1="32" x2="90" y2="32" stroke="${W_SHD}" stroke-width="1.3" opacity="0.6"/>
  <line x1="10" y1="36" x2="90" y2="36" stroke="${W_SHD}" stroke-width="1.3" opacity="0.6"/>
  <!-- Wood grain lines on planks -->
  <line x1="30" y1="20" x2="30" y2="38" stroke="${W_MID}" stroke-width="0.8" opacity="0.3"/>
  <line x1="50" y1="20" x2="50" y2="38" stroke="${W_MID}" stroke-width="0.8" opacity="0.3"/>
  <line x1="70" y1="20" x2="70" y2="38" stroke="${W_MID}" stroke-width="0.8" opacity="0.3"/>
  <!-- Left face of deck (lit, NW light) -->
  <path d="M 10,20 L 10,43 L 6,45 L 6,22 Z" fill="${W_LIT}" opacity="0.8"/>
  <!-- Right face of deck (shadow) -->
  <path d="M 90,20 L 90,43 L 94,45 L 94,22 Z" fill="${W_SHD}" opacity="0.6"/>
  <!-- Top lit edge highlight -->
  <line x1="10" y1="20" x2="90" y2="20" stroke="${GOLD}" stroke-width="2" opacity="0.75"/>
  <!-- Left post foot detail -->
  <rect x="13" y="58" width="11" height="3" rx="1" fill="${W_MID}" opacity="0.6"/>
  <rect x="44" y="58" width="11" height="3" rx="1" fill="${W_MID}" opacity="0.6"/>
  <rect x="75" y="58" width="11" height="3" rx="1" fill="${W_MID}" opacity="0.6"/>
</svg>`,
}
