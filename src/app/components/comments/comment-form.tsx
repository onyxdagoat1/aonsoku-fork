import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/app/hooks/use-auth'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  isSubmitting: boolean
  entityType: 'artist' | 'album' | 'compilation' | 'single'
}

export default function CommentForm({
  onSubmit,
  isSubmitting,
  entityType,
}: CommentFormProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError(t('comments.form.error.empty'))
      return
    }

    if (content.length > 1000) {
      setError(t('comments.form.error.tooLong'))
      return
    }

    try {
      await onSubmit(content.trim())
      setContent('')
    } catch (err) {
      setError(t('comments.form.error.failed'))
    }
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t('comments.form.loginRequired')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('comments.form.placeholder', {
            type: entityType,
          })}
          disabled={isSubmitting}
          className="min-h-[100px] resize-none pr-12"
          maxLength={1000}
        />
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {content.length}/1000
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? t('comments.form.posting') : t('comments.form.post')}
        </Button>
      </div>
    </form>
  )
}
