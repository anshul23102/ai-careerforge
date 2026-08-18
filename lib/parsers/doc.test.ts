import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseDoc } from './doc'
import { ParseError } from './errors'

const fixtures = join(__dirname, '__fixtures__')

describe('parseDoc', () => {
  it('extracts text from a valid legacy .doc file', async () => {
    const buffer = await readFile(join(fixtures, 'sample.doc'))
    const text = await parseDoc(buffer)
    expect(text).toContain('John Doe')
    expect(text).toContain('Acme Corp')
  })

  it('throws a ParseError for a buffer that is not a valid .doc file', async () => {
    const buffer = Buffer.from('not a real word document')
    await expect(parseDoc(buffer)).rejects.toThrow(ParseError)
  })
})
