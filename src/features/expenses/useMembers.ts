import { useHome } from '../../hooks/useHousehold'
import type { MemberProfile } from '../../types'

/** Los dos integrantes del hogar en el formato que espera MemberPicker. */
export function useMembers(): Array<{ uid: string; profile: MemberProfile }> {
  const { uid, partnerUid, myProfile, partnerProfile } = useHome()
  return [
    { uid, profile: myProfile ?? { name: 'Vos', photoURL: null } },
    ...(partnerUid
      ? [{ uid: partnerUid, profile: partnerProfile ?? { name: 'Tu pareja', photoURL: null } }]
      : []),
  ]
}
