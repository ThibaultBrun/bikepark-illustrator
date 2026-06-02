import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import type { SidebarSectionId } from '../components/sidebar/types'

/**
 * Visite guidee de l'interface : des bulles avec une fleche pointent
 * successivement vers les outils de l'application (driver.js).
 */

const TOUR_SEEN_KEY = 'bpi:tour-seen:v1'

type TourStep = DriveStep & { section?: SidebarSectionId }

export type TourControls = {
  /** Ouvre le panneau lateral sur la section demandee. */
  openSection: (id: SidebarSectionId) => void
  /** Force l'etat ouvert/ferme du panneau lateral. */
  setSidebarOpen: (open: boolean) => void
}

export function hasSeenTour() {
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markTourSeen() {
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, '1')
  } catch {
    /* stockage indisponible : on ignore */
  }
}

function buildSteps(isDesktop: boolean): TourStep[] {
  // Sur desktop on pointe le rail vertical, sur mobile la barre d'onglets.
  const tool = isDesktop ? 'tool' : 'm-tool'
  const side = isDesktop ? 'right' : 'bottom'

  const steps: TourStep[] = [
    {
      popover: {
        title: 'Bienvenue 👋',
        description:
          'Petit tour de Bikepark Illustrator en 30 secondes. Tu pourras le relancer quand tu veux depuis la rubrique Aide.',
      },
    },
  ]

  if (isDesktop) {
    steps.push({
      element: '[data-tour="menu"]',
      popover: {
        title: 'Le menu',
        description: 'Ce bouton ouvre et ferme le panneau d’outils.',
        side: 'right',
        align: 'start',
      },
    })
  }

  steps.push(
    {
      element: `[data-tour="${tool}-track"]`,
      section: 'track',
      popover: {
        title: '1. Pistes',
        description:
          'Importe tes fichiers GPX et personnalise les traces : couleur, épaisseur, style de ligne et labels.',
        side,
      },
    },
    {
      element: `[data-tour="${tool}-symbol"]`,
      section: 'symbol',
      popover: {
        title: '2. Symboles',
        description:
          'Glisse-dépose des symboles (remontées, parkings, départs…) sur la carte. Tu peux aussi importer tes propres SVG.',
        side,
      },
    },
    {
      element: `[data-tour="${tool}-map"]`,
      section: 'map',
      popover: {
        title: '3. Carte',
        description:
          'Change le fond (satellite / OSM), active le relief 3D et règle l’ombrage du terrain.',
        side,
      },
    },
    {
      element: `[data-tour="${tool}-export"]`,
      section: 'export',
      popover: {
        title: '4. Export',
        description:
          'Sauvegarde ton projet et exporte-le en ZIP pour le rouvrir plus tard ou le partager.',
        side,
      },
    },
    {
      element: '[data-tour="map"]',
      popover: {
        title: 'La carte',
        description:
          'C’est ici que ton bikepark prend vie. Déplace, zoome, et incline (clic droit maintenu) pour la vue 3D.',
        side: 'left',
      },
    },
    {
      element: `[data-tour="${tool}-help"]`,
      section: 'help',
      popover: {
        title: 'Besoin d’aide ?',
        description:
          'Tu retrouves ce tuto et l’aide ici à tout moment. Bon ride ! 🚵',
        side,
      },
    },
  )

  return steps
}

export function startTour(controls: TourControls) {
  const isDesktop = window.matchMedia('(min-width: 961px)').matches

  // Sur mobile, le rail est masque : on ouvre le panneau pour que la barre
  // d'onglets (et donc les ancres du tuto) soit visible.
  if (!isDesktop) {
    controls.setSidebarOpen(true)
    controls.openSection('track')
  }

  const instance = driver({
    showProgress: true,
    progressText: '{{current}} / {{total}}',
    nextBtnText: 'Suivant',
    prevBtnText: 'Précédent',
    doneBtnText: 'Terminé',
    overlayColor: '#020617',
    overlayOpacity: 0.6,
    stagePadding: 6,
    stageRadius: 14,
    onHighlightStarted: (_el, step) => {
      const section = (step as TourStep).section
      if (section) controls.openSection(section)
    },
    onDestroyed: () => {
      markTourSeen()
    },
    steps: buildSteps(isDesktop) as DriveStep[],
  })

  instance.drive()
}
