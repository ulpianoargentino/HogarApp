import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader, SegmentedControl } from '../../components/ui'
import ProvisionsPanel from './ProvisionsPanel'
import ShoppingList from './ShoppingList'

type Tab = 'lista' | 'provisiones'

export default function ShoppingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const tab: Tab = location.pathname === '/compras/provisiones' ? 'provisiones' : 'lista'

  return (
    <div>
      <PageHeader title="Compras" />
      <div className="px-4 pt-1 pb-2">
        <SegmentedControl<Tab>
          options={[
            { value: 'lista', label: 'Lista' },
            { value: 'provisiones', label: 'Provisiones' },
          ]}
          value={tab}
          onChange={(v) =>
            navigate(v === 'provisiones' ? '/compras/provisiones' : '/compras', { replace: true })
          }
        />
      </div>
      {tab === 'lista' ? <ShoppingList /> : <ProvisionsPanel />}
    </div>
  )
}
