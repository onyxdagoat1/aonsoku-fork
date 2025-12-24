import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { Upload, X } from 'lucide-react'
import { ArtworkType, useArtworkStore } from '@/store/artwork.store'

interface UploadArtworkDialogProps {
  trigger?: React.ReactNode
}

export function UploadArtworkDialog({ trigger }: UploadArtworkDialogProps) {
  const { t } = useTranslation()
  const { addArtwork } = useArtworkStore()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [artworkName, setArtworkName] = useState('')
  const [artistName, setArtistName] = useState('')
  const [editor, setEditor] = useState('')
  const [compEra, setCompEra] = useState('')
  const [type, setType] = useState<ArtworkType>(ArtworkType.Artwork)
  const [description, setDescription] = useState('')
  const [imageData, setImageData] = useState<string>('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const resetForm = () => {
    setArtworkName('')
    setArtistName('')
    setEditor('')
    setCompEra('')
    setType(ArtworkType.Artwork)
    setDescription('')
    setImageData('')
    setImagePreview('')
    setErrorMessage('')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setImageData(base64)
      setImagePreview(base64)
      setErrorMessage('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    // Validation
    if (!artworkName.trim()) {
      setErrorMessage('Artwork name is required')
      return
    }
    if (!artistName.trim()) {
      setErrorMessage('Artist name is required')
      return
    }
    if (!compEra.trim()) {
      setErrorMessage('Comp/Era is required')
      return
    }
    if (!imageData) {
      setErrorMessage('Please upload an image')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await addArtwork({
        artworkName: artworkName.trim(),
        artistName: artistName.trim(),
        editor: editor.trim() || undefined,
        compEra: compEra.trim(),
        type,
        description: description.trim(),
        imageData,
      })

      resetForm()
      setOpen(false)
      // Success feedback
      setTimeout(() => {
        alert('Artwork uploaded successfully!')
      }, 100)
    } catch (error) {
      setErrorMessage('Failed to upload artwork')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Artwork
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Custom Artwork</DialogTitle>
          <DialogDescription>
            Add your custom artwork with detailed information and tags
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image *</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageData('')
                    setImagePreview('')
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-sm text-primary hover:underline">
                    Click to upload
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {' '}or drag and drop
                  </span>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, WEBP up to 5MB
                </p>
              </div>
            )}
          </div>

          {/* Artwork Name */}
          <div className="space-y-2">
            <Label htmlFor="artwork-name">Artwork Name *</Label>
            <Input
              id="artwork-name"
              value={artworkName}
              onChange={(e) => setArtworkName(e.target.value)}
              placeholder="e.g., Cowboy Carter Tour Poster"
            />
          </div>

          {/* Artist Name */}
          <div className="space-y-2">
            <Label htmlFor="artist-name">Artist Name *</Label>
            <Input
              id="artist-name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="e.g., Beyoncé"
            />
          </div>

          {/* Editor (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="editor">Editor (Optional)</Label>
            <Input
              id="editor"
              value={editor}
              onChange={(e) => setEditor(e.target.value)}
              placeholder="e.g., Your name if you edited this"
            />
          </div>

          {/* Comp/Era */}
          <div className="space-y-2">
            <Label htmlFor="comp-era">Comp/Era *</Label>
            <Input
              id="comp-era"
              value={compEra}
              onChange={(e) => setCompEra(e.target.value)}
              placeholder="e.g., Cowboy Carter Era, Renaissance Era"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as ArtworkType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ArtworkType.SingleCover}>
                  Single Cover
                </SelectItem>
                <SelectItem value={ArtworkType.Artwork}>Artwork</SelectItem>
                <SelectItem value={ArtworkType.AlbumCover}>
                  Comp/Album Cover
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details about this artwork..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload Artwork'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
