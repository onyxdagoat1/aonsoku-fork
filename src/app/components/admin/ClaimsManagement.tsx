import { Check, ShieldAlert, UserCheck, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Separator } from '@/app/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

// Mock Data for Claims
const initialClaims = [
  {
    id: '1',
    user: 'CoolUser123',
    yeditorName: 'Kanye West',
    date: '2025-12-30',
    message: 'I am actually Ye. Verify me.',
    status: 'pending',
  },
  {
    id: '2',
    user: 'MusicLover99',
    yeditorName: 'Mike Dean',
    date: '2025-12-31',
    message: 'Official producer account.',
    status: 'pending',
  },
]

export function ClaimsManagement() {
  const [claims, setClaims] = useState(initialClaims)
  const { toast } = useToast()

  const handleApprove = (id: string, name: string) => {
    setClaims(claims.filter((c) => c.id !== id))
    toast({
      title: 'Claim Approved',
      description: `User has been linked to ${name}.`,
      className: 'bg-green-500/10 border-green-500/20',
    })
    // In real app: call yeditorService.linkYeditorToUser
  }

  const handleDeny = (id: string) => {
    setClaims(claims.filter((c) => c.id !== id))
    toast({
      title: 'Claim Denied',
      description: 'Request removed.',
      variant: 'destructive',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Yeditor Claims</h2>
          <p className="text-muted-foreground">
            Review and manage profile claim requests.
          </p>
        </div>
        <Badge variant="outline" className="h-8 px-3">
          {claims.length} Pending
        </Badge>
      </div>

      <div className="grid gap-4">
        {claims.length === 0 ? (
          <Card className="bg-muted/50 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserCheck className="w-12 h-12 mb-4 opacity-20" />
              <p>No pending claims.</p>
            </CardContent>
          </Card>
        ) : (
          claims.map((claim) => (
            <Card key={claim.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-6 p-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {claim.yeditorName}
                    </h3>
                    <span className="text-muted-foreground text-sm">
                      claimed by
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {claim.user}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md italic">
                    "{claim.message}"
                  </p>
                  <p className="text-xs text-muted-foreground pt-1">
                    Requested on {claim.date}
                  </p>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 justify-center border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 mt-4 sm:mt-0">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-32 gap-2"
                    onClick={() => handleApprove(claim.id, claim.yeditorName)}
                  >
                    <Check className="w-4 h-4" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-32 gap-2"
                    onClick={() => handleDeny(claim.id)}
                  >
                    <X className="w-4 h-4" /> Deny
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
