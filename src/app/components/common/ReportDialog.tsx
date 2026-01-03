import { AlertTriangle, Flag } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface ReportDialogProps {
  contentId: string
  contentType: 'post' | 'comment' | 'user' | 'message'
  trigger?: React.ReactNode
}

export function ReportDialog({
  contentId,
  contentType,
  trigger,
}: ReportDialogProps) {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!profile) {
      toast.error('You must be logged in to report content')
      return
    }

    if (!reason) {
      toast.error('Please select a reason for the report')
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase.from('content_reports').insert({
        reporter_id: profile.id,
        content_type: contentType,
        content_id: contentId,
        reason,
        description: description.trim() || null,
        status: 'pending',
      })

      if (error) throw error

      toast.success('Report submitted successfully')
      setOpen(false)
      setReason('')
      setDescription('')
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          >
            <Flag className="w-4 h-4 mr-2" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Please describe why this content is
            inappropriate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">
                  Spam or unwanted commercial content
                </SelectItem>
                <SelectItem value="harassment">
                  Harassment or bullying
                </SelectItem>
                <SelectItem value="hate_speech">Hate speech</SelectItem>
                <SelectItem value="violence">
                  Violence or dangerous organizations
                </SelectItem>
                <SelectItem value="nudity">
                  Nudity or sexual activity
                </SelectItem>
                <SelectItem value="intellectual_property">
                  Intellectual property violation
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (Optional)
            </label>
            <Textarea
              placeholder="Provide more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
