# Resume File Upload & Multi-Format Parsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the assessment form's resume paste box with a file upload that extracts text server-side from PDF, DOCX, DOC, RTF, LaTeX (.tex), TXT, and MD files, and shows the extracted text as an editable preview before submission.

**Architecture:** A new `POST /api/parse-resume` Next.js App Router route (Node.js runtime) receives a `multipart/form-data` upload, dispatches to a format-specific parser in `lib/parsers/`, and returns extracted plain text. The existing `/api/analyze` route and its `resumeText: string` contract are untouched — the new route is a pre-step that feeds the same field.

**Tech Stack:** Next.js App Router route handlers, `pdf-parse` (PDF), `mammoth` (DOCX), `word-extractor` (DOC), `rtf-to-text` (RTF), a custom regex-based stripper (LaTeX), Vitest (new — no test framework exists in this repo yet).

## Global Constraints

- Max upload size: 5MB (from spec).
- Supported extensions: `.pdf`, `.docx`, `.doc`, `.rtf`, `.tex`, `.txt`, `.md` (from spec).
- No OCR, no separate backend service, no paste-text fallback (all explicitly deferred/excluded per spec).
- Uploaded files are parsed entirely in memory, never written to disk (matches the app's existing stateless, no-persistence design).
- All new parsing libraries must be pure JS/TS with no native binary dependencies and no shelling out to external processes.

---

## Before you start

Real test fixture files already exist at `lib/parsers/__fixtures__/` (generated via macOS `textutil`/`cupsfilter` and verified against each library during design):

- `sample.pdf`, `sample.docx`, `sample.doc`, `sample.rtf`, `sample.tex`, `sample.txt`, `sample.md` — all contain the same resume text ("John Doe... Software Engineer... EXPERIENCE... Built scalable APIs using Node.js and TypeScript at Acme Corp from 2022 to 2026.") so tests can assert on consistent content.
- `corrupted.pdf`, `corrupted.docx` — truncated/invalid versions of the above, for error-path testing.
- `unsupported.png` — a non-resume file for extension-rejection testing.

Do not regenerate these — use them as-is in the tasks below.

---

### Task 1: Add Vitest and wire up the test script

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm test` runs the full Vitest suite once (no watch).

- [ ] **Step 1: Install Vitest as a dev dependency**

Run: `npm install --save-dev vitest@^4.1.11`

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 3: Add the test script**

In `package.json`, add a `"test"` entry to `"scripts"` (alongside the existing `dev`/`build`/`start`/`lint`):

```json
    "test": "vitest run"
```

- [ ] **Step 4: Verify the runner works with no tests yet**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" (or exits 0) — this confirms the config loads. This is expected since no `*.test.ts` files exist yet.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "Add Vitest test runner"
```

---

### Task 2: Shared constants and error type

**Files:**
- Create: `lib/parsers/constants.ts`
- Create: `lib/parsers/errors.ts`

**Interfaces:**
- Produces: `MAX_FILE_SIZE_BYTES: number`, `SUPPORTED_EXTENSIONS: string[]` (from `constants.ts`); `class ParseError extends Error` (from `errors.ts`).
- Consumed by: every parser file (Task 3–8), the dispatcher (Task 9), the API route (Task 10), and the frontend form (Task 11).

This file is deliberately separate from the parser implementations: `constants.ts` has zero dependencies, so the client-side form (Task 11) can import it directly without pulling `pdf-parse`/`mammoth`/`word-extractor` (all Node-only libraries) into the browser bundle.

- [ ] **Step 1: Create the constants file**

Create `lib/parsers/constants.ts`:

```ts
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export const SUPPORTED_EXTENSIONS: string[] = ['.pdf', '.docx', '.doc', '.rtf', '.tex', '.txt', '.md']
```

- [ ] **Step 2: Create the error type**

Create `lib/parsers/errors.ts`:

```ts
export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/parsers/constants.ts lib/parsers/errors.ts
git commit -m "Add shared constants and ParseError type for resume parsing"
```

---

### Task 3: Plaintext parser (.txt, .md)

**Files:**
- Create: `lib/parsers/plaintext.ts`
- Test: `lib/parsers/plaintext.test.ts`

**Interfaces:**
- Produces: `parsePlaintext(buffer: Buffer): string`

- [ ] **Step 1: Write the failing test**

Create `lib/parsers/plaintext.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/parsers/plaintext.test.ts`
Expected: FAIL — `Cannot find module './plaintext'`

- [ ] **Step 3: Write the implementation**

Create `lib/parsers/plaintext.ts`:

```ts
export function parsePlaintext(buffer: Buffer): string {
  return buffer.toString('utf-8')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/parsers/plaintext.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/parsers/plaintext.ts lib/parsers/plaintext.test.ts
git commit -m "Add plaintext resume parser for .txt/.md"
```

---

### Task 4: RTF parser

**Files:**
- Create: `lib/parsers/rtf.ts`
- Test: `lib/parsers/rtf.test.ts`

**Interfaces:**
- Consumes: `ParseError` from `./errors`
- Produces: `parseRtf(buffer: Buffer): string` (throws `ParseError` on failure)

`rtf-to-text`'s `stripRtf` doesn't treat a backslash immediately followed by a literal newline as a line break (macOS/Cocoa RTF writers emit this form). Without normalizing it first, paragraph breaks are silently lost — verified during design against a real `textutil`-generated RTF fixture. The implementation below fixes this before calling the library.

- [ ] **Step 1: Write the failing test**

Create `lib/parsers/rtf.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseRtf } from './rtf'
import { ParseError } from './errors'

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/parsers/rtf.test.ts`
Expected: FAIL — `Cannot find module './rtf'`

- [ ] **Step 3: Install rtf-to-text**

Run: `npm install rtf-to-text@^0.1.1`

- [ ] **Step 4: Write the implementation**

Create `lib/parsers/rtf.ts`:

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/parsers/rtf.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/parsers/rtf.ts lib/parsers/rtf.test.ts package.json package-lock.json
git commit -m "Add RTF resume parser with line-break normalization fix"
```

---

### Task 5: LaTeX parser (.tex)

**Files:**
- Create: `lib/parsers/latex.ts`
- Test: `lib/parsers/latex.test.ts`

**Interfaces:**
- Consumes: `ParseError` from `./errors`
- Produces: `parseLatex(buffer: Buffer): string` (throws `ParseError` on failure)

No full LaTeX engine is used — this is a regex-based stripper tuned for typical single-column resume `.tex` sources (verified against a representative fixture during design). It is not a general LaTeX parser.

- [ ] **Step 1: Write the failing test**

Create `lib/parsers/latex.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/parsers/latex.test.ts`
Expected: FAIL — `Cannot find module './latex'`

- [ ] **Step 3: Write the implementation**

Create `lib/parsers/latex.ts`:

```ts
export function parseLatex(buffer: Buffer): string {
  const source = buffer.toString('utf-8')
  let text = source

  // Keep only the body between \begin{document} and \end{document}, if present
  const docMatch = text.match(/\\begin\{document\}([\s\S]*)\\end\{document\}/)
  if (docMatch) text = docMatch[1]

  // Strip comments: an unescaped % to end of line (but not \%)
  text = text.replace(/(^|[^\\])%.*$/gm, '$1')

  // Unescape common escaped characters
  text = text
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&')
    .replace(/\\_/g, '_')
    .replace(/\\#/g, '#')

  // Drop environment markers (itemize, enumerate, etc.), keep their content
  text = text.replace(/\\begin\{[^}]*\}(\[[^\]]*\])?/g, '').replace(/\\end\{[^}]*\}/g, '')

  // \item -> a plain bullet
  text = text.replace(/\\item\s*/g, '- ')

  // Commands with a text argument, e.g. \textbf{x}, \section*{x} -> x.
  // Run repeatedly to unwrap nested commands like \textbf{\textit{x}}.
  for (let i = 0; i < 3; i++) {
    text = text.replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?\{([^{}]*)\}/g, '$2')
  }

  // Remaining argument-less commands (e.g. \\, \newpage) - drop them
  text = text.replace(/\\[a-zA-Z]+\*?/g, '')

  // Collapse excess whitespace
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

  return text
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/parsers/latex.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add lib/parsers/latex.ts lib/parsers/latex.test.ts
git commit -m "Add LaTeX resume parser"
```

---

### Task 6: PDF parser

**Files:**
- Create: `lib/parsers/pdf.ts`
- Test: `lib/parsers/pdf.test.ts`

**Interfaces:**
- Consumes: `ParseError` from `./errors`
- Produces: `parsePdf(buffer: Buffer): Promise<string>` (rejects with `ParseError` on failure)

- [ ] **Step 1: Write the failing test**

Create `lib/parsers/pdf.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/parsers/pdf.test.ts`
Expected: FAIL — `Cannot find module './pdf'`

- [ ] **Step 3: Install pdf-parse**

Run: `npm install pdf-parse@^2.4.5`

- [ ] **Step 4: Write the implementation**

Create `lib/parsers/pdf.ts`:

```ts
import { PDFParse } from 'pdf-parse'
import { ParseError } from './errors'

export async function parsePdf(buffer: Buffer): Promise<string> {
  let parser: PDFParse | undefined
  try {
    parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    return result.text
  } catch {
    throw new ParseError(
      'This PDF could not be read. It may be corrupted, password-protected, or contain no extractable text (e.g. a scanned image).'
    )
  } finally {
    if (parser) await parser.destroy()
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/parsers/pdf.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/parsers/pdf.ts lib/parsers/pdf.test.ts package.json package-lock.json
git commit -m "Add PDF resume parser"
```

---

### Task 7: DOCX parser

**Files:**
- Create: `lib/parsers/docx.ts`
- Test: `lib/parsers/docx.test.ts`

**Interfaces:**
- Consumes: `ParseError` from `./errors`
- Produces: `parseDocx(buffer: Buffer): Promise<string>` (rejects with `ParseError` on failure)

- [ ] **Step 1: Write the failing test**

Create `lib/parsers/docx.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/parsers/docx.test.ts`
Expected: FAIL — `Cannot find module './docx'`

- [ ] **Step 3: Install mammoth**

Run: `npm install mammoth@^1.12.1`

- [ ] **Step 4: Write the implementation**

Create `lib/parsers/docx.ts`:

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/parsers/docx.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/parsers/docx.ts lib/parsers/docx.test.ts package.json package-lock.json
git commit -m "Add DOCX resume parser"
```

---

### Task 8: Legacy DOC parser

**Files:**
- Create: `lib/parsers/doc.ts`
- Test: `lib/parsers/doc.test.ts`

**Interfaces:**
- Consumes: `ParseError` from `./errors`
- Produces: `parseDoc(buffer: Buffer): Promise<string>` (rejects with `ParseError` on failure)

- [ ] **Step 1: Write the failing test**

Create `lib/parsers/doc.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/parsers/doc.test.ts`
Expected: FAIL — `Cannot find module './doc'`

- [ ] **Step 3: Install word-extractor and its types**

Run: `npm install word-extractor@^1.0.4 && npm install --save-dev @types/word-extractor@^1.0.6`

- [ ] **Step 4: Write the implementation**

Create `lib/parsers/doc.ts`:

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/parsers/doc.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/parsers/doc.ts lib/parsers/doc.test.ts package.json package-lock.json
git commit -m "Add legacy DOC resume parser"
```

---

### Task 9: Format dispatcher

**Files:**
- Create: `lib/parsers/index.ts`
- Test: `lib/parsers/index.test.ts`

**Interfaces:**
- Consumes: `parsePdf` (Task 6), `parseDocx` (Task 7), `parseDoc` (Task 8), `parseRtf` (Task 4), `parseLatex` (Task 5), `parsePlaintext` (Task 3), `ParseError` (Task 2)
- Produces: `parseResumeFile(filename: string, buffer: Buffer): Promise<string>` (rejects with `ParseError` for unsupported extensions or empty extracted text)

- [ ] **Step 1: Write the failing test**

Create `lib/parsers/index.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/parsers/index.test.ts`
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 3: Write the implementation**

Create `lib/parsers/index.ts`:

```ts
import { parsePdf } from './pdf'
import { parseDocx } from './docx'
import { parseDoc } from './doc'
import { parseRtf } from './rtf'
import { parseLatex } from './latex'
import { parsePlaintext } from './plaintext'
import { ParseError } from './errors'

export { MAX_FILE_SIZE_BYTES, SUPPORTED_EXTENSIONS } from './constants'

export async function parseResumeFile(filename: string, buffer: Buffer): Promise<string> {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()

  let text: string
  switch (ext) {
    case '.pdf':
      text = await parsePdf(buffer)
      break
    case '.docx':
      text = await parseDocx(buffer)
      break
    case '.doc':
      text = await parseDoc(buffer)
      break
    case '.rtf':
      text = parseRtf(buffer)
      break
    case '.tex':
      text = parseLatex(buffer)
      break
    case '.txt':
    case '.md':
      text = parsePlaintext(buffer)
      break
    default:
      throw new ParseError(
        `Unsupported file type "${ext}". Supported formats: PDF, DOCX, DOC, RTF, TEX, TXT, MD.`
      )
  }

  if (!text.trim()) {
    throw new ParseError(
      "No readable text was found in this file. If it's a scanned or image-based document, try a different file."
    )
  }

  return text
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/parsers/index.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Run the full parser test suite**

Run: `npm test`
Expected: all test files in `lib/parsers/` pass.

- [ ] **Step 6: Commit**

```bash
git add lib/parsers/index.ts lib/parsers/index.test.ts
git commit -m "Add resume format dispatcher"
```

---

### Task 10: `/api/parse-resume` route

**Files:**
- Create: `app/api/parse-resume/route.ts`
- Test: `app/api/parse-resume/route.test.ts`

**Interfaces:**
- Consumes: `parseResumeFile`, `MAX_FILE_SIZE_BYTES` (from `../../../lib/parsers`), `ParseError` (from `../../../lib/parsers/errors`)
- Produces: `POST(request: NextRequest): Promise<NextResponse>` — `200 { text: string }` on success; `400 { error: string }` for a missing file, oversized file, unsupported format, or unparseable content; `500 { error: string }` for unexpected errors.

Note: Vercel's serverless functions have a request body size ceiling around 4.5MB on some plans. A 5MB file plus multipart overhead can occasionally exceed that on deploy even though it passes local testing — if this becomes an issue after deploying, lowering `MAX_FILE_SIZE_BYTES` in `lib/parsers/constants.ts` is the fix; no code structure changes needed.

- [ ] **Step 1: Write the failing test**

Create `app/api/parse-resume/route.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { MAX_FILE_SIZE_BYTES } from '../../../lib/parsers'

const fixtures = join(__dirname, '../../../lib/parsers/__fixtures__')

function makeRequest(file: File): NextRequest {
  const formData = new FormData()
  formData.set('file', file)
  return new NextRequest('http://localhost/api/parse-resume', { method: 'POST', body: formData })
}

describe('POST /api/parse-resume', () => {
  it('returns extracted text for a valid PDF', async () => {
    const buffer = await readFile(join(fixtures, 'sample.pdf'))
    const file = new File([buffer], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.text).toContain('John Doe')
  })

  it('returns 400 when no file is provided', async () => {
    const request = new NextRequest('http://localhost/api/parse-resume', {
      method: 'POST',
      body: new FormData(),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 for a file over the size limit', async () => {
    const oversized = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1, 'a')
    const file = new File([oversized], 'resume.txt', { type: 'text/plain' })
    const response = await POST(makeRequest(file))
    const body = await response.json()
    expect(response.status).toBe(400)
    expect(body.error).toMatch(/5MB/)
  })

  it('returns 400 for an unsupported file type', async () => {
    const buffer = await readFile(join(fixtures, 'unsupported.png'))
    const file = new File([buffer], 'resume.png', { type: 'image/png' })
    const response = await POST(makeRequest(file))
    const body = await response.json()
    expect(response.status).toBe(400)
    expect(body.error).toMatch(/Unsupported/)
  })

  it('returns 400 for a corrupted PDF', async () => {
    const buffer = await readFile(join(fixtures, 'corrupted.pdf'))
    const file = new File([buffer], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))
    const body = await response.json()
    expect(response.status).toBe(400)
    expect(body.error).toMatch(/could not be read/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/parse-resume/route.test.ts`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write the implementation**

Create `app/api/parse-resume/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { parseResumeFile, MAX_FILE_SIZE_BYTES } from '../../../lib/parsers'
import { ParseError } from '../../../lib/parsers/errors'

export const runtime = 'nodejs'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file was provided.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'This file is larger than 5MB. Please upload a smaller file.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await parseResumeFile(file.name, buffer)

    return NextResponse.json({ text })
  } catch (error: unknown) {
    if (error instanceof ParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Resume parse error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to parse resume: ${message}` }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/parse-resume/route.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Run the full test suite and type-check**

Run: `npm test && npx tsc --noEmit`
Expected: all tests pass, no type errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/parse-resume/route.ts app/api/parse-resume/route.test.ts
git commit -m "Add /api/parse-resume route"
```

---

### Task 11: Replace the resume paste box with a file upload in the form

**Files:**
- Modify: `components/AssessmentForm.tsx`

**Interfaces:**
- Consumes: `MAX_FILE_SIZE_BYTES`, `SUPPORTED_EXTENSIONS` (from `../lib/parsers/constants` — the lightweight constants module, not `../lib/parsers`, so no Node-only parsing libraries are pulled into the client bundle)
- No new exports — this is a leaf UI change. Verified manually (Task 12), since this codebase has no component test infrastructure and adding one is out of scope for this feature.

- [ ] **Step 1: Add the import and new state**

In `components/AssessmentForm.tsx`, update the `'react'` import (line 3) to include the event types used below:

```ts
import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react'
```

Add a new import right after the existing `AssessmentData` import (after line 11):

```ts
import { MAX_FILE_SIZE_BYTES, SUPPORTED_EXTENSIONS } from '../lib/parsers/constants'
```

Inside the `AssessmentForm` component, after the existing state declarations (after line 103, `const startTime = useRef(Date.now())`), add:

```ts
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isParsingResume, setIsParsingResume] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
```

- [ ] **Step 2: Add the file-handling functions**

After the existing `updateSkill` function (after line 128), add:

```ts
  async function handleResumeFile(file: File) {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setErrors((prev) => ({
        ...prev,
        resumeText: `Unsupported file type "${ext}". Supported formats: PDF, DOCX, DOC, RTF, TEX, TXT, MD.`,
      }))
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors((prev) => ({ ...prev, resumeText: 'This file is larger than 5MB. Please upload a smaller file.' }))
      return
    }

    setIsParsingResume(true)
    setErrors((prev) => ({ ...prev, resumeText: '' }))
    try {
      const body = new FormData()
      body.set('file', file)
      const res = await fetch('/api/parse-resume', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to parse file')
      setResumeFile(file)
      update('resumeText', data.text)
    } catch (err) {
      setResumeFile(null)
      setErrors((prev) => ({
        ...prev,
        resumeText: err instanceof Error ? err.message : 'Failed to parse file',
      }))
    } finally {
      setIsParsingResume(false)
    }
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleResumeFile(file)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleResumeFile(file)
  }

  function removeResumeFile() {
    setResumeFile(null)
    update('resumeText', '')
  }
```

- [ ] **Step 3: Replace the Step 2 JSX block**

Replace the entire `{/* ── STEP 2: Resume ── */}` block (lines 351–405 — from `{currentStep === 2 && (` through its matching `)}`) with:

```tsx
              {/* ── STEP 2: Resume ── */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Your Resume</h2>
                    <p className="text-white/40 text-sm">Upload your resume in any common format</p>
                  </div>

                  <div
                    className="p-4 rounded-2xl text-sm flex items-start gap-3"
                    style={{ background: 'rgba(110,180,255,0.06)', border: '1px solid rgba(110,180,255,0.15)' }}
                  >
                    <span className="text-cyan-400 mt-0.5">💡</span>
                    <p className="text-white/60">
                      <strong className="text-white">Tip:</strong> PDF, Word (.doc/.docx), RTF, LaTeX (.tex), and plain text/Markdown are all supported. After upload, you can review and edit the extracted text before continuing.
                    </p>
                  </div>

                  {!resumeFile && (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300"
                      style={{
                        borderColor: isDragging ? 'rgba(165,180,252,0.6)' : 'rgba(255,255,255,0.15)',
                        background: isDragging ? 'rgba(165,180,252,0.08)' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={SUPPORTED_EXTENSIONS.join(',')}
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      {isParsingResume ? (
                        <>
                          <Loader2 size={28} className="mx-auto mb-3 text-white/50 animate-spin" />
                          <p className="text-white/60 text-sm">Reading your resume...</p>
                        </>
                      ) : (
                        <>
                          <FileText size={28} className="mx-auto mb-3 text-white/40" />
                          <p className="text-white/70 text-sm font-medium">Drag & drop your resume, or click to browse</p>
                          <p className="text-white/30 text-xs mt-2">PDF, DOC, DOCX, RTF, TEX, TXT, MD &middot; up to 5MB</p>
                        </>
                      )}
                    </div>
                  )}

                  {errors.resumeText && <p className="text-red-400 text-xs">{errors.resumeText}</p>}

                  {resumeFile && (
                    <div className="space-y-3">
                      <div
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <FileText size={16} className="text-cyan-400" />
                          {resumeFile.name}
                        </div>
                        <button
                          type="button"
                          onClick={removeResumeFile}
                          className="text-xs text-white/40 hover:text-white/70 transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Extracted Text
                          <span className="text-white/30 font-normal ml-2">(edit if anything looks off)</span>
                        </label>
                        <textarea
                          className="input-field resize-none"
                          rows={12}
                          value={formData.resumeText}
                          onChange={(e) => update('resumeText', e.target.value)}
                          style={{ fontFamily: 'inherit', lineHeight: 1.6 }}
                        />
                        <div className="flex justify-end mt-2">
                          <span
                            className="text-xs"
                            style={{
                              color: formData.resumeText.length < 100
                                ? 'rgba(249,115,22,0.8)'
                                : 'rgba(255,255,255,0.3)'
                            }}
                          >
                            {formData.resumeText.length} chars {formData.resumeText.length < 100 && `(min 100)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
```

Note: `validateStep()` (line 138–141) still checks `formData.resumeText.length < 100` — this is unchanged and continues to work, since `resumeText` is still populated (now from the parse response, editable) instead of typed directly.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/AssessmentForm.tsx
git commit -m "Replace resume paste box with file upload in assessment form"
```

---

### Task 12: Manual end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the full flow with a PDF**

In a browser, go to `/assess`, fill Step 1, and on Step 2 upload `lib/parsers/__fixtures__/sample.pdf`. Confirm:
- A loading state briefly appears.
- The extracted text ("John Doe... Acme Corp...") appears in an editable textarea.
- Continuing through Steps 3–4 and submitting produces a completed assessment on `/results`.

- [ ] **Step 3: Verify the full flow with a DOCX**

Repeat Step 2 using `lib/parsers/__fixtures__/sample.docx`.

- [ ] **Step 4: Verify error handling**

On Step 2, try uploading `lib/parsers/__fixtures__/unsupported.png`. Confirm a clear inline error appears (not a generic failure) and no file is accepted. Then upload a valid file afterward and confirm it recovers normally.

- [ ] **Step 5: Run the full automated suite one more time**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all pass.

- [ ] **Step 6: Commit if any fixups were needed**

If manual verification surfaced any fixes, commit them with a message describing what was wrong (e.g. `git commit -m "Fix <specific issue found during manual verification>"`).

---

### Task 13: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the resume step description**

Find the line in `README.md` that describes the resume step as pasted text (search for "paste" or "resume text box") and update it to describe file upload instead — e.g. "Upload your resume (PDF, DOCX, DOC, RTF, LaTeX, TXT, or MD) — the app extracts the text automatically, and you can review or edit it before continuing."

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Update README to describe resume file upload"
```

---

## Self-review notes

- **Spec coverage:** file upload replacing paste box (Task 11), all 7 formats (Tasks 3–9), editable extracted-text preview (Task 11), 5MB limit + validation (Tasks 9, 10, 11), specific error messages for unsupported/oversized/corrupted/empty files (Tasks 9, 10, 11), in-memory only parsing — no disk writes (all parser implementations operate on `Buffer` only), no OCR / no separate backend / no paste fallback (none introduced). README follow-up from the spec's open questions is covered by Task 13.
- **Type consistency:** `parseResumeFile(filename: string, buffer: Buffer): Promise<string>` is the same signature used in Task 9's implementation and Task 10's route. `MAX_FILE_SIZE_BYTES` and `SUPPORTED_EXTENSIONS` are defined once in `lib/parsers/constants.ts` (Task 2) and re-exported from `lib/parsers/index.ts` (Task 9) for the route, while the frontend (Task 11) imports the constants module directly to avoid bundling server-only parsing libraries into client code.
