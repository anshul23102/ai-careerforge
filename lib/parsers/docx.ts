import mammoth from 'mammoth'
import { ParseError } from './errors'

export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch {
    throw new ParseError('This DOCX file could not be read. It may be corrupted or not a valid Word document.')
  }
}
