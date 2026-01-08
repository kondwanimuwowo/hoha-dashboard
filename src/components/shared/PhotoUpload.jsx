import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const MAX_FILE_SIZE = 1024 * 1024 // 1MB in bytes

export function PhotoUpload({ value, onChange, className }) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState(value || null)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setError('File size must be less than 1MB')
            return
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file')
            return
        }

        setError(null)
        setUploading(true)

        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `photos/${fileName}`

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('photos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('photos')
                .getPublicUrl(filePath)

            setPreview(publicUrl)
            onChange(publicUrl)
        } catch (err) {
            console.error('Upload error:', err)
            setError(err.message || 'Failed to upload photo')
        } finally {
            setUploading(false)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        onChange(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className={cn('space-y-4', className)}>
            {preview ? (
                <div className="relative inline-block">
                    <img
                        src={preview?.startsWith('http') ? preview : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${preview}`}
                        alt="Preview"
                        className="h-32 w-32 rounded-lg object-cover border-2 border-border"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                        {uploading ? 'Uploading...' : 'Click to upload photo'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Max size: 1MB</p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
            />

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    )
}
