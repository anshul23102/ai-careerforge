import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseResumeFile } from './index'
import { ParseError } from './errors'

const fixtures = join(__dirname, '__fixtures__')

describe('parseResumeFile', () => {
  it('dispatches .pdf to the PDF parser', async () => {
    const buffer = await readFile(join(fixtures, 'sample.pdf'))
    expect(await parseResumeFile('resume.pdf', buffer)).toContain('John Doe')
  })

  it('dispatches .docx to the DOCX parser', async () => {
    const buffer = await readFile(join(fixtures, 'sample.docx'))
    expect(await parseResumeFile('resume.docx', buffer)).toContain('John Doe')
  })

  it('dispatches .doc to the DOC parser', async () => {
    const buffer = await readFile(join(fixtures, 'sample.doc'))
    expect(await parseResumeFile('resume.doc', buffer)).toContain('John Doe')
  })

  it('dispatches .rtf to the RTF parser', async () => {
    const buffer = await readFile(join(fixtures, 'sample.rtf'))
    expect(await parseResumeFile('resume.rtf', buffer)).toContain('John Doe')
  })

  it('dispatches .tex to the LaTeX parser', async () => {
    const buffer = await readFile(join(fixtures, 'sample.tex'))
    expect(await parseResumeFile('resume.tex', buffer)).toContain('John Doe')
  })

  it('dispatches .txt to the plaintext parser', async () => {
    const buffer = await readFile(join(fixtures, 'sample.txt'))
    expect(await parseResumeFile('resume.txt', buffer)).toContain('John Doe')
  })

  it('dispatches .md to the plaintext parser', async () => {
    const buffer = await readFile(join(fixtures, 'sample.md'))
    expect(await parseResumeFile('resume.md', buffer)).toContain('John Doe')
  })

  it('is case-insensitive on file extension', async () => {
    const buffer = await readFile(join(fixtures, 'sample.txt'))
    expect(await parseResumeFile('RESUME.TXT', buffer)).toContain('John Doe')
  })

  it('throws a ParseError for an unsupported extension', async () => {
    const buffer = await readFile(join(fixtures, 'unsupported.png'))
    await expect(parseResumeFile('resume.png', buffer)).rejects.toThrow(ParseError)
  })

  it('throws a ParseError when extracted text is empty or whitespace-only', async () => {
    const buffer = Buffer.from('   \n\t  ')
    await expect(parseResumeFile('resume.txt', buffer)).rejects.toThrow(ParseError)
  })
})
