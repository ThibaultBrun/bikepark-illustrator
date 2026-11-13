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
  <ellipse cx="50" cy="63" rx="30" ry="5" fill="${SHAD}"/>
  <!-- Left face lit (NW) — narrow sliver, converges toward top -->
  <path d="M 16,60 L 24,60 L 30,16 L 22,18 Z" fill="${D_LIT}"/>
  <!-- Ramp face (viewer-facing) — dominant surface -->
  <path d="M 24,60 L 76,62 L 66,16 L 30,16 Z" fill="${D_MID}"/>
  <!-- Upper lit band near lip (sky light) -->
  <path d="M 30,16 L 66,16 L 56,28 L 36,30 Z" fill="${D_LIT}" opacity="0.42"/>
  <!-- Right shadow face -->
  <path d="M 76,62 L 78,58 L 68,14 L 66,16 Z" fill="${D_SHD}"/>
  <!-- Base front strip -->
  <path d="M 16,60 L 76,62 L 76,66 L 16,64 Z" fill="${D_SHD}"/>
  <!-- Packed-dirt compaction lines (horizontal, follow ramp slope) -->
  <path d="M 25,54 Q 50,55 74,57" stroke="${D_SHD}" stroke-width="0.9" fill="none" opacity="0.5"/>
  <path d="M 27,44 Q 50,45 72,46" stroke="${D_SHD}" stroke-width="0.8" fill="none" opacity="0.4"/>
  <path d="M 30,34 Q 50,34 70,35" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.3"/>
  <!-- Curved lip — golden, prominent -->
  <path d="M 22,18 Q 46,9 68,14" stroke="${GOLD}" stroke-width="2.8" stroke-linecap="round" fill="none" opacity="0.9"/>
  <!-- Lip bevel underside (subtle curve) -->
  <path d="M 22,18 Q 46,21 68,16" stroke="${D_LIT}" stroke-width="1.4" fill="none" opacity="0.5"/>
</svg>`,

  // ── DOUBLE : deux rampes / gap jump ──────────────────────────────────
  double: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <!-- shadow -->
  <ellipse cx="50" cy="64" rx="42" ry="5.5" fill="${SHAD}"/>
  <!-- === KICKER 1 (left, takeoff) === -->
  <!-- Left face lit (NW) — narrow -->
  <path d="M 4,58 L 12,58 L 16,16 L 8,18 Z" fill="${D_LIT}"/>
  <!-- Ramp face viewer-facing -->
  <path d="M 12,58 L 42,60 L 36,16 L 16,16 Z" fill="${D_MID}"/>
  <!-- Upper lit zone -->
  <path d="M 16,16 L 36,16 L 30,26 L 20,28 Z" fill="${D_LIT}" opacity="0.42"/>
  <!-- Right shadow strip K1 -->
  <path d="M 42,60 L 44,56 L 38,14 L 36,16 Z" fill="${D_SHD}"/>
  <!-- Base K1 -->
  <path d="M 4,58 L 42,60 L 42,64 L 4,62 Z" fill="${D_SHD}"/>
  <!-- Dirt lines K1 -->
  <path d="M 13,52 Q 28,53 41,55" stroke="${D_SHD}" stroke-width="0.8" fill="none" opacity="0.45"/>
  <path d="M 15,40 Q 28,41 39,42" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.35"/>
  <path d="M 17,28 Q 28,28 37,29" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.28"/>
  <!-- Lip K1 (curved, golden) -->
  <path d="M 8,18 Q 22,9 38,14" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.9"/>
  <path d="M 8,18 Q 22,21 38,16" stroke="${D_LIT}" stroke-width="1.2" fill="none" opacity="0.5"/>
  <!-- === GAP (visible ground) === -->
  <path d="M 44,61 L 56,61 L 56,65 L 44,65 Z" fill="${D_MID}" opacity="0.3"/>
  <!-- === KICKER 2 (right, landing — mirrored) === -->
  <!-- Left shadow strip K2 -->
  <path d="M 56,60 L 58,56 L 62,14 L 60,16 Z" fill="${D_SHD}"/>
  <!-- Ramp face viewer-facing (mirrored) -->
  <path d="M 58,60 L 62,16 L 84,16 L 88,58 Z" fill="${D_MID}"/>
  <!-- Upper lit zone mirrored -->
  <path d="M 62,16 L 84,16 L 80,28 L 68,26 Z" fill="${D_LIT}" opacity="0.42"/>
  <!-- Right face lit (NW = right side of K2) -->
  <path d="M 88,58 L 96,58 L 92,18 L 84,16 Z" fill="${D_LIT}"/>
  <!-- Base K2 -->
  <path d="M 56,60 L 96,58 L 96,62 L 56,64 Z" fill="${D_SHD}"/>
  <!-- Dirt lines K2 -->
  <path d="M 59,54 Q 72,53 87,52" stroke="${D_SHD}" stroke-width="0.8" fill="none" opacity="0.45"/>
  <path d="M 61,42 Q 72,41 85,40" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.35"/>
  <path d="M 63,28 Q 72,28 83,27" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.28"/>
  <!-- Lip K2 (mirrored golden lip) -->
  <path d="M 62,14 Q 72,9 92,18" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.9"/>
  <path d="M 62,16 Q 72,19 92,18" stroke="${D_LIT}" stroke-width="1.2" fill="none" opacity="0.5"/>
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
  <ellipse cx="52" cy="62" rx="38" ry="6" fill="${SHAD}"/>
  <!-- Banked wall = crescent sweeping left→right, inner (low) edge near viewer,
       outer (high) rim banks away. Built from a bottom curve + top rim curve. -->
  <!-- Base dirt mass (the whole banked turn body) -->
  <path d="M 12,56 Q 30,66 54,64 Q 80,62 90,38 Q 86,28 74,30 Q 60,48 38,50 Q 22,51 14,50 Z" fill="${D_MID}"/>
  <!-- Riding surface (tilted lit face, catches NW light) -->
  <path d="M 14,50 Q 28,52 40,50 Q 62,47 76,30 Q 84,30 88,38 Q 78,56 56,59 Q 34,61 16,54 Z" fill="${D_LIT}"/>
  <!-- Inner trough shadow (low near edge, far from light) -->
  <path d="M 12,56 Q 30,64 52,62 Q 40,56 26,55 Q 18,55 12,56 Z" fill="${D_SHD}" opacity="0.7"/>
  <!-- Compaction arcs following the bank curve (volume read) -->
  <path d="M 18,52 Q 42,52 62,38 Q 70,32 78,31" stroke="${D_SHD}" stroke-width="0.9" fill="none" opacity="0.4"/>
  <path d="M 20,55 Q 44,55 64,42 Q 73,36 82,35" stroke="${D_SHD}" stroke-width="0.8" fill="none" opacity="0.32"/>
  <path d="M 24,58 Q 46,58 66,46 Q 76,40 85,40" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.26"/>
  <!-- Outer rim highlight (golden lip along the top of the bank) -->
  <path d="M 14,50 Q 40,51 58,47 Q 74,42 88,38" stroke="${GOLD}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.9"/>
  <!-- Rim bevel under-curve -->
  <path d="M 16,52 Q 40,53 58,49 Q 74,44 86,41" stroke="${D_LIT}" stroke-width="1.1" fill="none" opacity="0.5"/>
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
