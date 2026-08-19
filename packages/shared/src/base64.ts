// Plain btoa()/atob() only support Latin1 (code points 0-255) and throw on
// any other Unicode character — including the em dashes, curly quotes, and
// non-breaking hyphens that show up routinely in natural LLM-generated text.
// These functions round-trip arbitrary Unicode text through base64 safely.

export function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function fromBase64Utf8(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}
