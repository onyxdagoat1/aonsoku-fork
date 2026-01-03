import { LivePartyRoom } from '@/app/components/party/LivePartyRoom'
import { useParams } from 'react-router-dom'

export default function PartyRoomPage() {
  const { id } = useParams<{ id: string }>()
  
  return <LivePartyRoom partyId={id!} />
}
