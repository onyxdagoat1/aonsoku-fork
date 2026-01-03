import { BadgeCheck, Check, Loader2, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAppData } from '@/store/app.store'

// We'll assume yeditorService has a method for this, or we'll add it.
// For now, mocking the request.
// import { yeditorService } from '@/service/yeditorService'

interface ClaimDialogProps {
  yeditorName: string
  yeditorId: string
}

export function ClaimDialog({ yeditorName, yeditorId }: ClaimDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { toast } = useToast()
  const { user } = useAppData()

  const handleClaim = async () => {
    if (!user) return

    setLoading(true)
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real implementation:
    // await yeditorService.submitClaimRequest(yeditorId, message)

    setLoading(false)
    setOpen(false)
    toast({
      title: 'Claim Request Sent',
      description: 'Admins will review your request to claim ' + yeditorName,
      action: (
        <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-green-500" />
        </div>
      ),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="gap-2 border-primary/20 hover:bg-primary/10"
        >
          <BadgeCheck className="w-4 h-4 text-primary" />
          Claim Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-primary/20">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Claim "{yeditorName}"
          </DialogTitle>
          <DialogDescription className="text-center">
            Verify your identity to manage this verified creator profile.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="message">Proof of Identity (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Links to social media, official website, or other proof..."
              className="resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Providing proof speeds up the verification process.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleClaim} disabled={loading} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
