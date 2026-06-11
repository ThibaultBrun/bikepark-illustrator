export type TrackStyle = 'solid' | 'arrow' | 'arrow-reverse' | 'dashed' | 'dotted'
export type TrackLabelStyle = 'classic' | 'soft' | 'bold' | 'ghost' | 'stamp'

// Métadonnées Pista (utilisées à la soumission). Alignées sur les enums Pista.
export type PistaTrailType = 'dh' | 'enduro' | 'uplift_lift' | 'uplift_bike'
export type PistaDifficulty = 'green' | 'blue' | 'red' | 'black'

export type GpxTrack = {
  id: string
  name: string
  color: string
  width: number
  style: TrackStyle
  label: string
  visible: boolean
  geojson: GeoJSON.FeatureCollection
  labelPosition?: [number, number]
  labelSize: number
  labelStyle: TrackLabelStyle
  trailType: PistaTrailType
  difficulty: PistaDifficulty
}
