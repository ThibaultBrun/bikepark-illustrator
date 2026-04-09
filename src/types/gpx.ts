export type TrackStyle = 'solid' | 'dashed' | 'dotted'

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
}