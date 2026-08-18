import { PDFParse } from 'pdf-parse'
import { ParseError } from './errors'

export async function parsePdf(buffer: Buffer): Promise<string> {
  let parser: PDFParse | undefined
  try {
    parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    return result.text
  } catch {
    throw new ParseError(
      'This PDF could not be read. It may be corrupted, password-protected, or contain no extractable text (e.g. a scanned image).'
    )
  } finally {
    if (parser) await parser.destroy()
  }
}
