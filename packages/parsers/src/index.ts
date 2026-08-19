import { parsePdf } from './pdf'
import { parseDocx } from './docx'
import { parseDoc } from './doc'
import { parseRtf } from './rtf'
import { parseLatex } from './latex'
import { parsePlaintext } from './plaintext'
import { ParseError } from './errors'

export { MAX_FILE_SIZE_BYTES, SUPPORTED_EXTENSIONS } from './constants'
export { ParseError } from './errors'

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
