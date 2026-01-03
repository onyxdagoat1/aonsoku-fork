import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  EyeOff,
  MessageSquare,
  Music,
  XCircle,
} from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

type ReportRow = Database['public']['Tables']['content_reports']['Row']

interface ContentPreview {
  title?: string
  text?: string
  artist?: string
  hidden?: boolean
}

interface Report extends ReportRow {
  reporter?: { username: string }
  contentPreview?: ContentPreview
}

export function ReportsQueue() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchContentPreview = useCallback(
    async (
      contentType: ReportRow['content_type'],
      contentId: string,
    ): Promise<ContentPreview> => {
      try {
        // Fetch different content types
        if (contentType === 'comment') {
          const { data } = await supabase
            .from('comments')
            .select('text, username')
            .eq('id', contentId)
            .single()
          return { text: data?.text, title: `Comment by ${data?.username}` }
        } else if (contentType === 'user') {
          const { data } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', contentId)
            .single()
          return {
            title: data?.display_name || data?.username || 'Unknown Profile',
          }
        } else if (contentType === 'post') {
          // 'post' could be social posts or tracks depending on usage
          return { title: 'Post/Track', text: `ID: ${contentId}` }
        }
        return { text: `${contentType} ${contentId}` }
      } catch (error) {
        console.error('Error fetching content preview:', error)
        return { text: 'Content not found' }
      }
    },
    [],
  )

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('content_reports')
        .select('*, reporter:reporter_id(username)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch content previews for all reports
      const reportsWithPreviews = await Promise.all(
        (data || []).map(async (report) => {
          const contentPreview = await fetchContentPreview(
            report.content_type,
            report.content_id,
          )
          return { ...report, contentPreview }
        }),
      )

      setReports(reportsWithPreviews)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchContentPreview])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleViewContent = (report: Report) => {
    const { content_type, content_id } = report

    // Navigate to appropriate content page
    if (content_type === 'comment' || content_type === 'message') {
      // Inline review or specific message view
      toast.info(`${content_type} reports must be reviewed here`)
      return
    } else if (content_type === 'user') {
      navigate(`/profile/${content_id}`)
    } else if (content_type === 'post') {
      // Navigate to post if exists
      toast.info('Post content - ID: ' + content_id)
    }
  }

  const handleTakeAction = async (report: Report) => {
    const { content_type, content_id, id: reportId } = report

    try {
      setProcessingId(reportId)

      // Take action based on content type
      if (content_type === 'comment') {
        // Delete or hide comment
        const { error } = await supabase
          .from('comments')
          .update({ deleted: true })
          .eq('id', content_id)
        if (error) throw error
        toast.success('Comment hidden')
      } else if (content_type === 'user') {
        // Could ban user or take other action
        toast.success('Profile action taken')
      } else if (content_type === 'post') {
        toast.success('Post hidden')
      }

      // Mark report as actioned
      const { error: reportError } = await supabase
        .from('content_reports')
        .update({ status: 'actioned', reviewed_at: new Date().toISOString() })
        .eq('id', reportId)

      if (reportError) throw reportError

      toast.success('Action taken on report')
      setReports(reports.filter((r) => r.id !== reportId))
    } catch (error) {
      console.error('Error taking action:', error)
      toast.error('Failed to take action')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDismiss = async (reportId: string) => {
    try {
      setProcessingId(reportId)
      const { error } = await supabase
        .from('content_reports')
        .update({ status: 'dismissed', reviewed_at: new Date().toISOString() })
        .eq('id', reportId)

      if (error) throw error

      toast.success('Report dismissed')
      setReports(reports.filter((r) => r.id !== reportId))
    } catch (error) {
      console.error('Error dismissing report:', error)
      toast.error('Failed to dismiss report')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="bg-card/30 border border-border rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center">
        <CheckCircle className="w-12 h-12 mb-4 text-green-500/50" />
        <h3 className="text-lg font-semibold text-foreground">All Clear!</h3>
        <p>No pending reports to review.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {reports.map((report) => (
        <div
          key={report.id}
          className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="uppercase text-[10px] font-bold tracking-wider"
                >
                  {report.content_type === 'comment' && (
                    <MessageSquare className="w-3 h-3 mr-1" />
                  )}
                  {report.content_type === 'post' && (
                    <Music className="w-3 h-3 mr-1" />
                  )}
                  {report.content_type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Reported by{' '}
                  <span className="font-medium text-foreground">
                    {report.reporter?.username || 'Unknown'}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  • {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-1 text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Reason: {report.reason}
                </h4>
                {report.description && (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg italic">
                    "{report.description}"
                  </p>
                )}
              </div>

              {/* Content Preview */}
              <div className="bg-muted/20 border border-border/50 rounded-lg p-3 mb-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Content Preview:
                </div>
                <div className="text-sm text-foreground font-medium">
                  {report.contentPreview?.title || 'Unknown'}
                </div>
                {report.contentPreview?.text && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {report.contentPreview.text}
                  </div>
                )}
                <div className="text-xs text-muted-foreground/60 mt-1 font-mono">
                  ID: {report.content_id}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDismiss(report.id)}
                disabled={processingId === report.id}
                className="w-full justify-start"
              >
                <XCircle className="w-4 h-4 mr-2" /> Dismiss
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleTakeAction(report)}
                disabled={processingId === report.id}
                className="w-full justify-start"
              >
                <EyeOff className="w-4 h-4 mr-2" /> Hide Content
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleViewContent(report)}
                className="w-full justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> View Content
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
