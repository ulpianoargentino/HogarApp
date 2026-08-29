import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader, SegmentedControl } from '../../components/ui'
import InventoryPanel from '../inventory/InventoryPanel'
import ShoppingList from './ShoppingList'

type Tab = 'lista' | 'despensa'

export default function ShoppingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const tab: Tab = location.pathname === '/compras/despensa' ? 'despensa' : 'lista'

  return (
    <div>
      <PageHeader title="Compras" />
      <div className="px-4 py-3">
        <SegmentedControl<Tab>
          options={[
            { value: 'lista', label: 'Lista' },
            { value: 'despensa', label: 'Despensa' },
          ]}
          value={tab}
          onChange={(v) =>
            navigate(v === 'despensa' ? '/compras/despensa' : '/compras', { replace: true })
          }
        />
      </div>
      {tab === 'lista' ? <ShoppingList /> : <InventoryPanel />}
    </div>
  )
}
