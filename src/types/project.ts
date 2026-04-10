import type { MapSettings } from '../components/sidebar/map-settings'
import type { GpxTrack } from './gpx'
import type { MapSymbol, SymbolDefinition } from './symbol'

export const PROJECT_ARCHIVE_NAME = 'bikepark-project.json'
export const PROJECT_STORAGE_KEY = 'bikepark-illustrator/project'
export const PROJECT_VERSION = 1

export type MapCameraState = {
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
}

export type BikeparkProject = {
  version: number
  savedAt: string
  projectName: string
  hasStartedWelcome: boolean
  tracks: GpxTrack[]
  symbols: MapSymbol[]
  customSymbols: SymbolDefinition[]
  mapSettings: MapSettings
  mapCamera: MapCameraState | null
}
