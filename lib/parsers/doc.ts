import WordExtractor from 'word-extractor'
import { ParseError } from './errors'

export async function parseDoc(buffer: Buffer): Promise<string> {
  try {
    const extractor = new WordExtractor()
    const doc = await extractor.extract(buffer)
    return doc.getBody()
  } catch {
    throw new ParseError('This DOC file could not be read. It may be corrupted or not a valid Word document.')
  }
}
