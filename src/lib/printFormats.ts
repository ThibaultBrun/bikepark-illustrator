export type PrintFormatId = 'a4p' | 'a4l' | 'square' | 'story'

export interface PrintFormat {
  id: PrintFormatId
  label: string
  sublabel: string
  icon: string
  /** width ratio unit */
  rw: number
  /** height ratio unit */
  rh: number
  /** poster canvas width in px */
  canvasW: number
}

function canvasH(fmt: PrintFormat): number {
  return Math.round(fmt.canvasW * (fmt.rh / fmt.rw))
}

export const PRINT_FORMATS: PrintFormat[] = [
  { id: 'a4p',    label: 'A4',       sublabel: 'Portrait',  icon: '📄', rw: 210, rh: 297, canvasW: 1080 },
  { id: 'a4l',    label: 'A4',       sublabel: 'Paysage',   icon: '📃', rw: 297, rh: 210, canvasW: 1527 },
  { id: 'square', label: 'Carré',    sublabel: '1:1',       icon: '🟫', rw: 1,   rh: 1,   canvasW: 1080 },
  { id: 'story',  label: 'Story',    sublabel: '9:16',      icon: '📱', rw: 9,   rh: 16,  canvasW: 1080 },
]

export function getCanvasSize(fmt: PrintFormat): { w: number; h: number } {
  return { w: fmt.canvasW, h: canvasH(fmt) }
}

export function getFormatById(id: PrintFormatId): PrintFormat {
  return PRINT_FORMATS.find(f => f.id === id) ?? PRINT_FORMATS[0]
}
