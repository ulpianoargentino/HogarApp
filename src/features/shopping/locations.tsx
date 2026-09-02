import { IconBox, IconSnowflake, IconSpray } from '../../components/icons'
import type { InventoryLocation } from '../../types'

/** Las tres categorías de Provisiones, con su ícono y etiqueta (orden de pantalla) */
export const LOCATIONS: Array<{
  value: InventoryLocation
  label: string
  Icon: typeof IconSnowflake
}> = [
  { value: 'heladera', label: 'Heladera', Icon: IconSnowflake },
  { value: 'despensa', label: 'Despensa', Icon: IconBox },
  { value: 'limpieza', label: 'Limpieza', Icon: IconSpray },
]
