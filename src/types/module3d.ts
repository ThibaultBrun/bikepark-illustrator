export type Module3DType = 'jump' | 'double' | 'table' | 'berm' | 'pumptrack' | 'northshore' | 'drop'

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
  drop: 'Drop',
}

// Sprites 3D (rendus Blender, golden hour). Le contact-sol est centré dans
// l'image (caméra visée sur z=0) → marker ancré 'center' = posé au sol.
import jumpUrl from '../assets/modules3d/jump.png'
import doubleUrl from '../assets/modules3d/double.png'
import tableUrl from '../assets/modules3d/table.png'
import bermUrl from '../assets/modules3d/berm.png'
import pumptrackUrl from '../assets/modules3d/pumptrack.png'
import northshoreUrl from '../assets/modules3d/northshore.png'

// Drop : SVG inline (PNG Blender à générer via TITOUS quand disponible)
const _DROP_SVG = `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg"><ellipse cx="52" cy="62" rx="40" ry="5" fill="rgba(30,42,90,0.22)"/><path d="M 10,58 Q 30,56 36,38 L 68,38 L 72,58 Z" fill="#A07840"/><path d="M 36,38 L 68,38 L 76,30 L 44,30 Z" fill="#D0A85A"/><path d="M 10,58 Q 30,56 36,38 L 44,30 Q 28,46 16,54 Z" fill="#D0A85A" opacity="0.88"/><path d="M 68,38 L 76,30 L 80,58 L 72,58 Z" fill="#6B4820"/><path d="M 69,42 L 77,36" stroke="#A07840" stroke-width="0.7" fill="none" opacity="0.5"/><path d="M 70,48 L 78,43" stroke="#A07840" stroke-width="0.7" fill="none" opacity="0.4"/><path d="M 71,54 L 79,50" stroke="#A07840" stroke-width="0.6" fill="none" opacity="0.35"/><path d="M 20,53 Q 32,46 37,36" stroke="#6B4820" stroke-width="0.7" fill="none" opacity="0.28"/><path d="M 44,30 L 76,30" stroke="#E8C050" stroke-width="2.4" stroke-linecap="round" opacity="0.92"/><path d="M 36,38 L 44,30" stroke="#E8C050" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/></svg>`
const _dropDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(_DROP_SVG)

export const MODULE3D_IMG: Record<Module3DType, string> = {
  jump: jumpUrl,
  double: doubleUrl,
  table: tableUrl,
  berm: bermUrl,
  pumptrack: pumptrackUrl,
  northshore: northshoreUrl,
  drop: _dropDataUrl,
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
  // ── JUMP : kicker iso 3/4, rider décolle vers la droite ───────────────
  // Flanc profil (D_MID) sous la ligne de roulage ; surface de roulage (D_LIT)
  // en parallélogramme décalé +7,-4 ; crête/lip doré sur l'arête haute.
  jump: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="54" cy="60" rx="34" ry="5" fill="${SHAD}"/>
  <!-- flanc profil (face avant-gauche, mid) -->
  <path d="M 16,57 Q 40,56 55,44 Q 70,33 76,21 L 81,57 Z" fill="${D_MID}"/>
  <!-- surface de roulage (dessus, éclairée) -->
  <path d="M 16,57 Q 40,56 55,44 Q 70,33 76,21 L 83,17 Q 77,29 62,40 Q 47,51 23,53 Z" fill="${D_LIT}"/>
  <!-- lignes de compaction qui suivent la pente -->
  <path d="M 22,54 Q 44,53 58,43 Q 70,35 76,26" stroke="${D_SHD}" stroke-width="0.8" fill="none" opacity="0.36"/>
  <path d="M 20,56 Q 42,55 56,46 Q 68,38 74,30" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.28"/>
  <!-- arête lip (drop) côté droit, légère ombre -->
  <path d="M 76,21 L 81,57" stroke="${D_SHD}" stroke-width="1" fill="none" opacity="0.4"/>
  <!-- crête dorée (arête haute de la surface) -->
  <path d="M 23,53 Q 47,51 62,40 Q 77,29 83,17" stroke="${GOLD}" stroke-width="2.3" stroke-linecap="round" fill="none" opacity="0.92"/>
  <!-- tip du lip -->
  <path d="M 76,21 L 83,17" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/>
</svg>`,

  // ── DOUBLE : deux kickers face à face (takeoff + landing), gap au milieu ─
  double: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="50" cy="61" rx="45" ry="5.5" fill="${SHAD}"/>
  <!-- gap : sol visible entre les deux -->
  <path d="M 41,57 L 59,57 L 57,61 L 43,61 Z" fill="${D_SHD}" opacity="0.32"/>
  <!-- === KICKER gauche (takeoff, décolle à droite) === -->
  <path d="M 6,57 Q 24,56 34,45 Q 42,37 45,27 L 48,57 Z" fill="${D_MID}"/>
  <path d="M 6,57 Q 24,56 34,45 Q 42,37 45,27 L 51,23 Q 46,34 38,42 Q 28,52 12,54 Z" fill="${D_LIT}"/>
  <path d="M 11,55 Q 26,54 36,45 Q 43,39 46,31" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.3"/>
  <path d="M 45,27 L 48,57" stroke="${D_SHD}" stroke-width="0.9" fill="none" opacity="0.4"/>
  <path d="M 12,54 Q 28,52 38,42 Q 46,34 51,23" stroke="${GOLD}" stroke-width="2.1" stroke-linecap="round" fill="none" opacity="0.9"/>
  <path d="M 45,27 L 51,23" stroke="${GOLD}" stroke-width="2.3" stroke-linecap="round"/>
  <!-- === KICKER droite (landing, miroir) === -->
  <path d="M 94,57 Q 76,56 66,45 Q 58,37 55,27 L 52,57 Z" fill="${D_MID}"/>
  <path d="M 94,57 Q 76,56 66,45 Q 58,37 55,27 L 49,23 Q 54,34 62,42 Q 72,52 88,54 Z" fill="${D_LIT}"/>
  <path d="M 89,55 Q 74,54 64,45 Q 57,39 54,31" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.3"/>
  <path d="M 55,27 L 52,57" stroke="${D_SHD}" stroke-width="0.9" fill="none" opacity="0.4"/>
  <path d="M 88,54 Q 72,52 62,42 Q 54,34 49,23" stroke="${GOLD}" stroke-width="2.1" stroke-linecap="round" fill="none" opacity="0.9"/>
  <path d="M 55,27 L 49,23" stroke="${GOLD}" stroke-width="2.3" stroke-linecap="round"/>
</svg>`,

  // ── TABLE : butte pleine = takeoff + plateau + landing (iso 3/4) ───────
  table: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="52" cy="60" rx="43" ry="5.5" fill="${SHAD}"/>
  <!-- flanc profil (mid) : montée, plateau, descente -->
  <path d="M 12,57 Q 24,56 30,42 L 33,31 L 69,31 L 72,42 Q 78,56 90,57 Z" fill="${D_MID}"/>
  <!-- plateau sommital plat (éclairé) -->
  <path d="M 33,31 L 69,31 L 77,26 L 41,26 Z" fill="${D_LIT}"/>
  <!-- rampe de takeoff (dessus éclairé) -->
  <path d="M 12,57 Q 24,56 30,42 L 33,31 L 41,26 Q 33,40 20,54 Z" fill="${D_LIT}" opacity="0.94"/>
  <!-- rampe de landing (dessus, moins exposé) -->
  <path d="M 69,31 L 77,26 Q 83,52 95,53 L 90,57 Q 78,56 72,42 Z" fill="${D_LIT}" opacity="0.72"/>
  <!-- compaction sur les deux rampes -->
  <path d="M 20,54 Q 30,44 33,33" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.3"/>
  <path d="M 72,42 Q 76,36 78,30" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.3"/>
  <!-- crête dorée le long de l'arête haute -->
  <path d="M 20,54 Q 33,40 41,26 L 77,26 Q 83,40 90,54" stroke="${GOLD}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9"/>
</svg>`,

  // ── BERM : virage relevé, mur banqué en iso 3/4 ─────────────────────
  // Viewer SW. Light NW. Le berm = mur de terre courbe qu'on longe penché.
  // On voit la FACE AVANT du mur (quasi-verticale, face viewer) + la surface
  // de roulage inclinée au-dessus. Rim doré trace le bord extérieur haut.
  // Berm = virage relevé : MUR HAUT banqué, concave. Surface de roulage
  // éclairée en haut (rim doré), gorge en ombre en bas. Hauteur marquée.
  berm: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="54" cy="59" rx="40" ry="5.5" fill="${SHAD}"/>
  <!-- dos du mur derrière le rim (ombre) -->
  <path d="M 24,26 Q 50,16 82,24 L 84,29 Q 52,21 26,31 Z" fill="${D_SHD}" opacity="0.6"/>
  <!-- surface de roulage banquée (concave, haute, éclairée) -->
  <path d="M 24,27 Q 50,17 82,25 L 88,47 Q 56,56 22,50 Z" fill="${D_LIT}"/>
  <!-- bande mid mi-hauteur (galbe) -->
  <path d="M 23,44 Q 54,49 85,41 Q 54,45 23,44 Z" fill="${D_MID}" opacity="0.35"/>
  <!-- gorge en ombre (bas du banking) -->
  <path d="M 22,50 Q 56,56 88,47 Q 60,52 40,52 Q 28,52 22,50 Z" fill="${D_SHD}" opacity="0.42"/>
  <!-- compaction qui suit le virage -->
  <path d="M 28,36 Q 52,30 80,35" stroke="${D_SHD}" stroke-width="0.8" fill="none" opacity="0.32"/>
  <path d="M 26,42 Q 54,38 84,40" stroke="${D_SHD}" stroke-width="0.8" fill="none" opacity="0.3"/>
  <path d="M 24,48 Q 54,52 86,45" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.24"/>
  <!-- end-cap gauche (épaisseur du mur) -->
  <path d="M 24,27 Q 22,40 22,50 L 24,49 Q 25,38 27,29 Z" fill="${D_SHD}" opacity="0.45"/>
  <!-- rim doré (lèvre haute) -->
  <path d="M 24,27 Q 50,17 82,25" stroke="${GOLD}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.93"/>
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

  // ── DROP : ledge/marche descendante, face cliff en ombre ─────────────
  drop: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="52" cy="62" rx="40" ry="5" fill="${SHAD}"/>
  <!-- corps principal front face, mi-ton -->
  <path d="M 10,58 Q 30,56 36,38 L 68,38 L 72,58 Z" fill="${D_MID}"/>
  <!-- top plateau (éclairé) -->
  <path d="M 36,38 L 68,38 L 76,30 L 44,30 Z" fill="${D_LIT}"/>
  <!-- rampe approche gauche (lit NW) -->
  <path d="M 10,58 Q 30,56 36,38 L 44,30 Q 28,46 16,54 Z" fill="${D_LIT}" opacity="0.88"/>
  <!-- face du drop — cliff vertical (ombre profonde) -->
  <path d="M 68,38 L 76,30 L 80,58 L 72,58 Z" fill="${D_SHD}"/>
  <!-- strates rocheuses dans la face du cliff -->
  <path d="M 69,42 L 77,36" stroke="${D_MID}" stroke-width="0.7" fill="none" opacity="0.5"/>
  <path d="M 70,48 L 78,43" stroke="${D_MID}" stroke-width="0.7" fill="none" opacity="0.4"/>
  <path d="M 71,54 L 79,50" stroke="${D_MID}" stroke-width="0.6" fill="none" opacity="0.35"/>
  <!-- compaction sur la rampe -->
  <path d="M 20,53 Q 32,46 37,36" stroke="${D_SHD}" stroke-width="0.7" fill="none" opacity="0.28"/>
  <!-- lip doré (arête du drop) -->
  <path d="M 44,30 L 76,30" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round" opacity="0.92"/>
  <path d="M 36,38 L 44,30" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>
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
