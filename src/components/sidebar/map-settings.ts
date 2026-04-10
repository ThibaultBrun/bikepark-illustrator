export type MapLabelFont =
  | 'segoe'
  | 'arial'
  | 'verdana'
  | 'trebuchet'
  | 'tahoma'
  | 'georgia'
  | 'palatino'
  | 'cambria'
  | 'impact'
  | 'courier'

export type MapSettings = {
  terrain: number
  hillshade: number
  labelFont: MapLabelFont
}

export const mapLabelFontOptions: {
  value: MapLabelFont
  label: string
  previewFamily: string
}[] = [
  { value: 'segoe', label: 'Segoe UI', previewFamily: '"Segoe UI", Tahoma, sans-serif' },
  { value: 'arial', label: 'Arial', previewFamily: 'Arial, Helvetica, sans-serif' },
  { value: 'verdana', label: 'Verdana', previewFamily: 'Verdana, Geneva, sans-serif' },
  { value: 'trebuchet', label: 'Trebuchet MS', previewFamily: '"Trebuchet MS", sans-serif' },
  { value: 'tahoma', label: 'Tahoma', previewFamily: 'Tahoma, Geneva, sans-serif' },
  { value: 'georgia', label: 'Georgia', previewFamily: 'Georgia, serif' },
  { value: 'palatino', label: 'Palatino', previewFamily: '"Palatino Linotype", "Book Antiqua", serif' },
  { value: 'cambria', label: 'Cambria', previewFamily: 'Cambria, Georgia, serif' },
  { value: 'impact', label: 'Impact', previewFamily: 'Impact, Haettenschweiler, sans-serif' },
  { value: 'courier', label: 'Courier New', previewFamily: '"Courier New", monospace' },
]
