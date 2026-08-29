// Sin 0/O/1/I/L para que sea fácil de dictar por teléfono
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateInviteCode(length = 6): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let code = ''
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length]
  return code
}
