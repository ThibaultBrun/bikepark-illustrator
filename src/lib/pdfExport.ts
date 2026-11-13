import type { PrintFormatId } from './printFormats'

// PDF page sizes in mm [width, height]
const PDF_SIZES: Record<PrintFormatId, [number, number]> = {
  a4p:    [210, 297],
  a4l:    [297, 210],
  square: [148, 148],
  story:  [90,  160],
}

export async function exportPosterAsPdf(posterBlob: Blob, formatId: PrintFormatId = 'a4p', fileName = 'bikepark-poster'): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const [pw, ph] = PDF_SIZES[formatId]
  const isLandscape = pw > ph

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pw, ph],
  })

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(posterBlob)
  })

  // Full-bleed: image fills the entire page, no margins
  pdf.addImage(dataUrl, 'PNG', 0, 0, pw, ph)
  pdf.save(`${fileName}-${formatId}.pdf`)
}
