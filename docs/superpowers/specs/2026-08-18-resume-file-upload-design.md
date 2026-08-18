# Resume File Upload & Multi-Format Parsing

## Problem

The assessment form's "resume" step is currently a plain text box the user pastes or types into. Module 7 of the interview guide flags this directly: the word "resume" implies a document, but there is no document parsing at all. This is confusing for users who have a resume as a file (PDF, Word doc, etc.) and shouldn't have to retype or copy-paste it.

## Goal

Let users upload their resume as a file in whatever common format they have it in, and have the app extract the text automatically. Keep the existing "under two minutes" pitch intact — parsing must be fast and synchronous within the flow, not a separate slow pipeline.

## Scope

**In scope:**
- File upload replacing the paste box in the assessment form's resume step
- Server-side text extraction for: PDF, DOCX, DOC (legacy binary), RTF, LaTeX (`.tex`), TXT, MD
- An editable preview of the extracted text before the user continues, so parsing mistakes can be caught and fixed
- File size limit (5MB) and format validation with clear, specific error messages

**Out of scope (explicitly deferred):**
- OCR for image-based resumes (photos, scanned PDFs with no text layer) — will show a clear "no extractable text found" error instead of silently failing or attempting OCR
- A separate/dedicated backend service — this stays a Next.js API route, consistent with the rest of the app's architecture
- A paste-text fallback — upload is now the only path into the resume step

## Architecture

A new route, `app/api/parse-resume/route.ts`, handles file upload and extraction:

- Runs on the Node.js runtime (`export const runtime = 'nodejs'`), not edge — the parsing libraries need Node APIs (Buffer, filesystem-adjacent APIs) that aren't available on edge.
- Accepts `multipart/form-data` with a single `file` field.
- Validates file size (≤5MB) and extension/MIME type before attempting to parse.
- Dispatches to a format-specific parser based on file extension.
- Returns `{ text: string }` on success, or `{ error: string }` with a specific, human-readable message on failure (unsupported format, corrupted file, empty/no extractable text, oversized file).

The existing `/api/analyze` route and `AssessmentData.resumeText: string` field are unchanged — the parse step happens earlier in the flow and hands off a plain string exactly as before. This keeps the analyze route and its prompt-building logic untouched.

## Format support and libraries

One focused library per format, not a single "universal" parser, so each format's extraction quality can be reasoned about and swapped independently:

| Format | Extension(s) | Library | Notes |
|---|---|---|---|
| PDF | `.pdf` | `pdf-parse` | Text-layer PDFs only. Image-only/scanned PDFs return empty text → explicit error, not silent failure. |
| Word (modern) | `.docx` | `mammoth` | Extracts plain text from the document body. |
| Word (legacy) | `.doc` | `word-extractor` | Pure JS, no native binary dependency (avoids shelling out to antiword/catdoc). |
| Rich Text | `.rtf` | `striprtf` | Pure JS. |
| LaTeX | `.tex` | Custom stripper (in `lib/parseLatex.ts`) | Regex-based: strips comments (`%...`), common formatting commands (`\textbf{}`, `\section{}`, etc.) while keeping their text content, and drops preamble-only commands. Not a full LaTeX engine — good enough for typical resume `.tex` sources, not arbitrary LaTeX documents. |
| Plain text | `.txt`, `.md` | None — read directly | No parsing needed; MD is read as-is (headers/formatting left in, since it's still readable). |

All chosen libraries are pure JavaScript/TypeScript with no native binary dependencies and no shelling out to external processes — this avoids the security surface of tools like Ghostscript or ImageMagick and keeps the route deployable on Vercel without extra system packages.

## UI flow

Step 2 of the assessment form (`components/AssessmentForm.tsx`) changes from a `<textarea>` paste box to a drag-and-drop/click-to-browse dropzone:

1. User drops or selects a file.
2. Client-side validation: extension allowlist and 5MB size check, before any network call (fast feedback for obviously-wrong files).
3. File is uploaded via `fetch` as `multipart/form-data` to `/api/parse-resume`.
4. A loading state shows while parsing (typically sub-second for text-based formats; PDFs may take slightly longer).
5. On success: the extracted text populates an editable `<textarea>` (not read-only) so the user can see exactly what will be analyzed and fix anything the parser got wrong — e.g. a two-column PDF layout extracting out of order. This textarea's value becomes `resumeText`, submitted through the existing flow unchanged.
6. On failure: a specific inline error message (not a generic toast) explaining what went wrong — "This file appears to be a scanned image with no extractable text. Try a different file." / "This file is larger than 5MB." / "Unsupported file type — supported formats: PDF, DOCX, DOC, RTF, TEX, TXT, MD."
7. User can remove the uploaded file and try a different one before continuing.

## Error handling & validation details

- **Size limit:** 5MB, enforced both client-side (immediate feedback) and server-side (authoritative — never trust the client).
- **Format allowlist:** both extension and MIME type checked; reject anything else with a clear message listing supported formats.
- **Empty extraction:** if parsing succeeds but yields empty or whitespace-only text (e.g. an image-only PDF), treat this as a user-facing error, not a silent pass-through of an empty resume.
- **Corrupted/malformed files:** each parser call is wrapped in try/catch; a parse exception becomes a "This file couldn't be read — it may be corrupted. Try re-saving and re-uploading it." message rather than a raw stack trace or generic 500.
- **No filesystem writes:** the uploaded file is parsed entirely in memory (as a `Buffer`) and never written to disk, consistent with the app's existing stateless, no-persistence design.

## Testing plan

- Unit-level: one small sample file per supported format (PDF, DOCX, DOC, RTF, TEX, TXT, MD) run through `/api/parse-resume`, asserting non-empty extracted text containing expected known content.
- Error-path cases: oversized file, unsupported extension (e.g. `.png`), empty/image-only PDF, corrupted file (truncated/garbage bytes with a valid extension).
- Manual verification in-browser: full assessment flow from file upload through to a completed analysis, for at least PDF and DOCX (the two most common real-world resume formats).

## Open questions / follow-ups (not blocking this spec)

- OCR support for image-based resumes is deferred; if added later, Tesseract.js was the candidate discussed (pure JS, no external API/cost).
- `README.md` still describes the resume step as a plain text paste — should be updated as part of implementation to reflect the new upload flow.
