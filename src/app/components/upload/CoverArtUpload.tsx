import {
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'

interface CoverArtUploadProps {
  onCoverArtSelected: (file: File | null) => void
  currentCoverArt?: string
}

export function CoverArtUpload({
  onCoverArtSelected,
  currentCoverArt,
}: CoverArtUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentCoverArt || null)
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateImage = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)')
      return false
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Image file size must be less than 10MB')
      return false
    }

    return true
  }

  const handleFileSelected = useCallback(
    (file: File) => {
      if (!validateImage(file)) return

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        onCoverArtSelected(file)
      }
      reader.readAsDataURL(file)
    },
    [onCoverArtSelected],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelected(file)
    } else {
      toast.error('Please drop an image file')
    }
  }

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            handleFileSelected(file)
            toast.success('Image pasted from clipboard')
          }
        }
      }
    },
    [handleFileSelected],
  )

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return

    setIsLoadingUrl(true)
    try {
      const response = await fetch(urlInput)
      const blob = await response.blob()

      // Create a file from the blob
      const filename = urlInput.split('/').pop() || 'cover-art.jpg'
      const file = new File([blob], filename, { type: blob.type })

      if (!validateImage(file)) {
        setIsLoadingUrl(false)
        return
      }

      handleFileSelected(file)
      setUrlInput('')
      toast.success('Cover art loaded from URL')
    } catch (error) {
      toast.error('Failed to load image from URL')
    } finally {
      setIsLoadingUrl(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onCoverArtSelected(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.info('Cover art removed')
  }

  // Add paste event listener
  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="w-4 h-4 mr-2" />
            From URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {preview ? (
            <div className="relative">
              <div className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-border">
                <img
                  src={preview}
                  alt="Cover art preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center
                transition-colors duration-200 cursor-pointer
                ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>

                <div>
                  <h4 className="font-medium mb-1">
                    {isDragging ? 'Drop image here' : 'Upload Cover Art'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Click to browse, drag & drop, or paste from clipboard
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPEG, PNG, WebP (max 10MB)
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cover-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="cover-url"
                type="url"
                placeholder="https://example.com/cover-art.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim() || isLoadingUrl}
              >
                {isLoadingUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Load'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a direct URL to an image file
            </p>
          </div>

          {preview && (
            <div className="relative">
              <div className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-border">
                <img
                  src={preview}
                  alt="Cover art preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
