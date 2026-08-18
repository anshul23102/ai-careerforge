import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseDocx } from './docx'
import { ParseError } from './errors'

const fixtures = join(__dirname, '__fixtures__')

describe('parseDocx', () => {
  it('extracts text from a valid DOCX file', async () => {
    const buffer = await readFile(join(fixtures, 'sample.docx'))
    const text = await parseDocx(buffer)
    expect(text).toContain('John Doe')
    expect(text).toContain('Acme Corp')
  })

  it('throws a ParseError for a corrupted DOCX', async () => {
    const buffer = await readFile(join(fixtures, 'corrupted.docx'))
    await expect(parseDocx(buffer)).rejects.toThrow(ParseError)
  })
})
