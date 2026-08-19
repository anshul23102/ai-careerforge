import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseLatex } from './latex'

const fixtures = join(__dirname, '__fixtures__')

describe('parseLatex', () => {
  it('strips preamble, comments, and commands while keeping visible text', async () => {
    const buffer = await readFile(join(fixtures, 'sample.tex'))
    const text = parseLatex(buffer)

    expect(text).toContain('John Doe')
    expect(text).toContain('Software Engineer')
    expect(text).toContain('Built scalable APIs using Node.js and TypeScript at Acme Corp from 2022 to 2026.')
    expect(text).toContain('Led migration to microservices, cutting latency by 40%.')

    // Preamble and comments must not leak through
    expect(text).not.toContain('documentclass')
    expect(text).not.toContain('This is a comment')
    // Command markup must not leak through
    expect(text).not.toContain('\\textbf')
    expect(text).not.toContain('\\section')
  })
})
