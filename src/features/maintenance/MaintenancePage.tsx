import { useState } from 'react'
import { PageHeader, SegmentedControl } from '../../components/ui'
import RepairsTab from './RepairsTab'
import WarrantiesTab from './WarrantiesTab'
import ContactsTab from './ContactsTab'

type Tab = 'arreglos' | 'garantias' | 'contactos'

export default function MaintenancePage() {
  const [tab, setTab] = useState<Tab>('arreglos')

  return (
    <div>
      <PageHeader title="Mantenimiento" />
      <div className="px-4 pt-3 pb-28">
        <SegmentedControl<Tab>
          options={[
            { value: 'arreglos', label: 'Arreglos' },
            { value: 'garantias', label: 'Garantías' },
            { value: 'contactos', label: 'Contactos' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'arreglos' && <RepairsTab />}
        {tab === 'garantias' && <WarrantiesTab />}
        {tab === 'contactos' && <ContactsTab />}
      </div>
    </div>
  )
}
