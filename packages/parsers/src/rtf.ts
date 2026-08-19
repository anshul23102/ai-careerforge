import { stripRtf } from 'rtf-to-text'
import { ParseError } from './errors'

export function parseRtf(buffer: Buffer): string {
  try {
    const raw = buffer.toString('utf-8')
    // Cocoa/macOS RTF writers emit a backslash followed by a literal
    // newline as a paragraph break. rtf-to-text only recognizes the
    // explicit \line control word, so normalize the shorthand first —
    // otherwise every paragraph break in Mac-authored RTF is silently lost.
    const normalized = raw.replace(/\\\r?\n/g, '\\line\n')
    return stripRtf(normalized)
  } catch {
    throw new ParseError('This RTF file could not be read. It may be corrupted.')
  }
}
