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
