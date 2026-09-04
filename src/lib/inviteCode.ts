// Sin 0/O/1/I/L para que sea fácil de dictar por teléfono
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const INVITE_CODE_LENGTH = 6

export function generateInviteCode(length = INVITE_CODE_LENGTH): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let code = ''
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length]
  return code
}

/**
 * Deja el código como está guardado en Firestore: mayúsculas y sin adornos.
 * Al pegarlo desde WhatsApp suelen colarse espacios, guiones o comillas y el
 * id del documento no coincide, así que se limpian antes de buscarlo.
 */
export function normalizeInviteCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH)
}
