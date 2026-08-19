import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parsePdf } from './pdf'
import { ParseError } from './errors'

const fixtures = join(__dirname, '__fixtures__')

describe('parsePdf', () => {
  it('extracts text from a valid text-layer PDF', async () => {
    const buffer = await readFile(join(fixtures, 'sample.pdf'))
    const text = await parsePdf(buffer)
    expect(text).toContain('John Doe')
    expect(text).toContain('Acme Corp')
  })

  it('throws a ParseError for a corrupted PDF', async () => {
    const buffer = await readFile(join(fixtures, 'corrupted.pdf'))
    await expect(parsePdf(buffer)).rejects.toThrow(ParseError)
  })
})
