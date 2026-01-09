import { useState, useRef } from 'react'
import { useStudentDocuments, useCreateStudentDocument, useDeleteStudentDocument } from '@/hooks/useRecords'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { Plus, Trash2, FileText, Download, Upload, Loader2, FileCode, FileImage, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function StudentDocuments({ studentId }) {
    const { user, profile } = useAuth()
    const { data: documents, isLoading } = useStudentDocuments(studentId)
    const createDocument = useCreateStudentDocument()
    const deleteDocument = useDeleteStudentDocument()

    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(null)

    const [docType, setDocType] = useState('Result')
    const [docNotes, setDocNotes] = useState('')
    const fileInputRef = useRef(null)

    const handleUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${studentId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${fileName}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('student-documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('student-documents')
                .getPublicUrl(filePath)

            // 3. Save to Database
            await createDocument.mutateAsync({
                student_id: studentId,
                document_type: docType,
                document_name: file.name,
                document_url: publicUrl,
                file_size: file.size,
                mime_type: file.type,
                notes: docNotes
            })

            toast.success('Document uploaded successfully')
            setDocNotes('')
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload document: ' + error.message)
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteDocument.mutateAsync({
                id: isDeleting.id,
                studentId,
                documentUrl: isDeleting.document_url
            })
            toast.success('Document deleted')
            setIsDeleting(null)
        } catch (error) {
            toast.error('Failed to delete document: ' + error.message)
        }
    }

    const getFileIcon = (mime) => {
        if (mime?.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />
        if (mime?.includes('image')) return <FileImage className="h-6 w-6 text-blue-500" />
        return <FileCode className="h-6 w-6 text-neutral-500" />
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const DOCUMENT_TYPES = ['Result', 'Report Card', 'Medical', 'Certificate', 'ID/Birth Certificate', 'Other']

    if (isLoading) return <div className="space-y-4">
        {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
    </div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        Academic & Legal Documents
                    </h3>
                    <p className="text-sm text-muted-foreground">Store and manage important student files</p>
                </div>
            </div>

            {/* Upload Section */}
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Document Type</Label>
                            <Select value={docType} onValueChange={setDocType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOCUMENT_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Input
                                placeholder="Add a description..."
                                value={docNotes}
                                onChange={(e) => setDocNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleUpload}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <Button
                            className="w-full h-16 border-2 border-dashed bg-transparent hover:bg-muted text-muted-foreground flex flex-col gap-1 items-center justify-center transition-all hover:border-primary/50"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>Uploading document...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-6 w-6" />
                                    <span>Click to upload (PDF, JPG, PNG, DOC)</span>
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Documents List */}
            <div className="space-y-3">
                {documents && documents.length > 0 ? (
                    documents.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden group hover:border-primary/50 transition-colors shadow-sm">
                            <div className="flex items-center p-4">
                                <div className="p-3 bg-muted rounded-lg mr-4 group-hover:bg-primary/5 transition-colors">
                                    {getFileIcon(doc.mime_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground truncate">{doc.document_name}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="font-semibold text-primary/80 uppercase tracking-wider">{doc.document_type}</span>
                                        <span>•</span>
                                        <span>{formatFileSize(doc.file_size)}</span>
                                        <span>•</span>
                                        <span>Uploaded {formatDate(doc.upload_date)}</span>
                                    </div>
                                    {doc.notes && (
                                        <p className="text-xs text-muted-foreground mt-2 italic">“{doc.notes}”</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={doc.document_url} download={doc.document_name}>
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    {(user?.id === doc.uploaded_by || profile?.role === 'Admin') && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => setIsDeleting(doc)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 rounded-xl border-2 border-dashed border-muted">
                        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                        <p className="text-muted-foreground font-medium">No documents found</p>
                        <p className="text-sm text-muted-foreground/60">Upload results, medical reports, or certificates</p>
                    </div>
                )}
            </div>

            {/* Delete Dialog */}
            <Dialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Document?</DialogTitle>
                        <DialogDescription>
                            This will permanently remove the document from the student's record and storage.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleting(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteDocument.isPending}>
                            {deleteDocument.isPending ? 'Deleting...' : 'Confirm Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
