export type TrackStyle = 'solid' | 'arrow' | 'arrow-reverse' | 'dashed' | 'dotted'
export type TrackLabelStyle = 'classic' | 'soft' | 'bold' | 'ghost' | 'stamp'

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
}
