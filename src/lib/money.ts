const fmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

/** 15300 → "$ 15.300" */
export function formatARS(amount: number): string {
  return fmt.format(amount)
}
