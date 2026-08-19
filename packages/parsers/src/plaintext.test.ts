import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parsePlaintext } from './plaintext'

const fixtures = join(__dirname, '__fixtures__')

describe('parsePlaintext', () => {
  it('reads a .txt buffer as UTF-8 text', async () => {
    const buffer = await readFile(join(fixtures, 'sample.txt'))
    const text = parsePlaintext(buffer)
    expect(text).toContain('John Doe')
    expect(text).toContain('Acme Corp')
  })

  it('reads a .md buffer as UTF-8 text', async () => {
    const buffer = await readFile(join(fixtures, 'sample.md'))
    const text = parsePlaintext(buffer)
    expect(text).toContain('John Doe')
  })
})
