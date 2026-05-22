import { useState, useRef } from 'react'
import { useStudentDocuments, useCreateStudentDocument, useDeleteStudentDocument } from '@/hooks/useRecords'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Plus, Trash2, FileText, Download, Upload, Loader2, FileCode, FileImage, ExternalLink, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const DOCUMENT_TYPES = ['Report Card', 'Result', 'Medical', 'Certificate', 'ID/Birth Certificate', 'Other']

export function StudentDocuments({ studentId }) {
    const { user, profile } = useAuth()
    const { data: documents, isLoading } = useStudentDocuments(studentId)
    const createDocument = useCreateStudentDocument()
    const deleteDocument = useDeleteStudentDocument()

    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(null)
    const [docType, setDocType] = useState('Report Card')
    const [docNotes, setDocNotes] = useState('')
    const [mode, setMode] = useState('provided') // 'provided' | 'upload'
    const [selectedFile, setSelectedFile] = useState(null)
    const fileInputRef = useRef(null)

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) setSelectedFile(file)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            if (mode === 'provided') {
                await createDocument.mutateAsync({
                    student_id: studentId,
                    document_type: docType,
                    document_name: docType + (docNotes ? ` — ${docNotes}` : ''),
                    document_url: null,
                    notes: docNotes,
                })
                toast.success('Document record saved')
            } else {
                if (!selectedFile) return

                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `${studentId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('student-documents')
                    .upload(fileName, selectedFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('student-documents')
                    .getPublicUrl(fileName)

                await createDocument.mutateAsync({
                    student_id: studentId,
                    document_type: docType,
                    document_name: selectedFile.name,
                    document_url: publicUrl,
                    file_size: selectedFile.size,
                    mime_type: selectedFile.type,
                    notes: docNotes,
                })
                toast.success('Document uploaded successfully')
            }

            setDocNotes('')
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Failed to save document: ' + error.message)
        } finally {
            setIsSaving(false)
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
        if (!bytes) return null
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const canSave = mode === 'provided' || (mode === 'upload' && !!selectedFile)

    if (isLoading) return (
        <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
        </div>
    )

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Academic & Legal Documents
                </h3>
                <p className="text-sm text-muted-foreground">Store and manage important student files</p>
            </div>

            {/* Add Document Card */}
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-6 space-y-4">

                    {/* Document type */}
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

                    {/* Mode toggle */}
                    <div className="space-y-2">
                        <Label>How is this being recorded?</Label>
                        <div className="flex gap-3">
                            <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mode === 'provided' ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40'}`}>
                                <input
                                    type="radio"
                                    name="docMode"
                                    value="provided"
                                    checked={mode === 'provided'}
                                    onChange={() => { setMode('provided'); setSelectedFile(null) }}
                                    className="accent-primary"
                                />
                                <div>
                                    <p className="text-sm font-medium">Physical copy provided</p>
                                    <p className="text-xs text-muted-foreground">Mark as received, no file needed</p>
                                </div>
                            </label>
                            <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mode === 'upload' ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40'}`}>
                                <input
                                    type="radio"
                                    name="docMode"
                                    value="upload"
                                    checked={mode === 'upload'}
                                    onChange={() => setMode('upload')}
                                    className="accent-primary"
                                />
                                <div>
                                    <p className="text-sm font-medium">Upload a file</p>
                                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* File picker — only shown in upload mode */}
                    {mode === 'upload' && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                            <div
                                className="w-full h-14 border-2 border-dashed rounded-lg bg-transparent hover:bg-muted text-muted-foreground flex items-center justify-center gap-2 transition-all hover:border-primary/50 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-4 w-4" />
                                <span className="text-sm">
                                    {selectedFile ? selectedFile.name : 'Click to choose a file'}
                                </span>
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes {mode === 'provided' ? '(e.g. Term 1, 2025)' : '(Optional)'}</Label>
                        <Input
                            placeholder={mode === 'provided' ? 'e.g. Term 1, 2025' : 'Add a description...'}
                            value={docNotes}
                            onChange={(e) => setDocNotes(e.target.value)}
                        />
                    </div>

                    <Button className="w-full" onClick={handleSave} disabled={!canSave || isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Save Document
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Documents List */}
            <div className="space-y-3">
                {documents && documents.length > 0 ? (
                    documents.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden group hover:border-primary/50 transition-colors shadow-sm">
                            <div className="flex items-center p-4">
                                <div className="p-3 bg-muted rounded-lg mr-4 group-hover:bg-primary/5 transition-colors">
                                    {doc.document_url
                                        ? getFileIcon(doc.mime_type)
                                        : <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground truncate">{doc.document_name}</h4>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">{doc.document_type}</span>
                                        {!doc.document_url && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-300 text-green-700">Physical copy</Badge>
                                        )}
                                        {doc.document_url && formatFileSize(doc.file_size) && (
                                            <>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                                            </>
                                        )}
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <span className="text-xs text-muted-foreground">{formatDate(doc.upload_date)}</span>
                                    </div>
                                    {doc.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">"{doc.notes}"</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                    {doc.document_url && (
                                        <>
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
                                        </>
                                    )}
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
                        <p className="text-sm text-muted-foreground/60">Record report cards, results, or other documents</p>
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
