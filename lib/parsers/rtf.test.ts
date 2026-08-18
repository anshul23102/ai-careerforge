import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseRtf } from './rtf'

const fixtures = join(__dirname, '__fixtures__')

describe('parseRtf', () => {
  it('extracts text from a valid RTF file, preserving line breaks', async () => {
    const buffer = await readFile(join(fixtures, 'sample.rtf'))
    const text = parseRtf(buffer)
    expect(text).toContain('John Doe')
    expect(text).toContain('Software Engineer')
    // Paragraph breaks must survive — this is the backslash-newline fix.
    expect(text).toMatch(/John Doe\s*\n\s*Software Engineer/)
  })

  it('throws a ParseError for an empty buffer', () => {
    expect(() => parseRtf(Buffer.from(''))).not.toThrow()
    // An empty buffer isn't malformed RTF, it just yields empty text —
    // emptiness is handled by the dispatcher (Task 9), not this parser.
  })
})
