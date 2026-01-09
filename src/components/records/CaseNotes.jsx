import { useState } from 'react'
import { useCaseNotes, useCreateCaseNote, useUpdateCaseNote, useDeleteCaseNote } from '@/hooks/useRecords'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, StickyNote, History, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export function CaseNotes({ personId }) {
    const { user, profile } = useAuth()
    const { data: notes, isLoading } = useCaseNotes(personId)
    const createNote = useCreateCaseNote()
    const updateNote = useUpdateCaseNote()
    const deleteNote = useDeleteCaseNote()

    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState(null)
    const [isDeleting, setIsDeleting] = useState(null)

    const [noteContent, setNoteContent] = useState('')
    const [noteType, setNoteType] = useState('General')

    const resetForm = () => {
        setNoteContent('')
        setNoteType('General')
        setIsAdding(false)
        setIsEditing(null)
    }

    const handleSave = async () => {
        if (!noteContent) {
            toast.error('Note content cannot be empty')
            return
        }

        try {
            if (isEditing) {
                await updateNote.mutateAsync({
                    id: isEditing.id,
                    person_id: personId,
                    note_content: noteContent,
                    note_type: noteType
                })
                toast.success('Note updated')
            } else {
                await createNote.mutateAsync({
                    person_id: personId,
                    note_content: noteContent,
                    note_type: noteType
                })
                toast.success('Note added')
            }
            resetForm()
        } catch (error) {
            toast.error('Failed to save note: ' + error.message)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteNote.mutateAsync({ id: isDeleting.id, person_id: personId })
            toast.success('Note deleted')
            setIsDeleting(null)
        } catch (error) {
            toast.error('Failed to delete note: ' + error.message)
        }
    }

    const startEditing = (note) => {
        setIsEditing(note)
        setNoteContent(note.note_content)
        setNoteType(note.note_type || 'General')
    }

    const NOTE_TYPES = ['General', 'Medical', 'Academic', 'Family', 'Behavioral', 'Emergency']

    if (isLoading) return <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
    </div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <StickyNote className="h-5 w-5 text-primary" />
                        Case Notes
                    </h3>
                    <p className="text-sm text-muted-foreground">Historical records and observations</p>
                </div>
                <Button onClick={() => setIsAdding(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                </Button>
            </div>

            {/* Notes Timeline */}
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                <AnimatePresence>
                    {notes && notes.length > 0 ? (
                        notes.map((note, index) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative flex items-start gap-6 pl-12"
                            >
                                {/* Timeline Dot */}
                                <div className="absolute left-0 mt-1 flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm ring-4 ring-neutral-50">
                                    <Clock className="h-5 w-5 text-primary/60" />
                                </div>

                                <Card className="flex-1 overflow-hidden transition-shadow hover:shadow-md">
                                    <div className="flex items-center justify-between bg-muted/30 px-4 py-2 text-xs border-b">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                {note.note_type || 'General'}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {formatDate(note.created_at, 'MMM dd, yyyy HH:mm')}
                                            </span>
                                            <span className="text-muted-foreground">• {note.creator?.full_name || 'Staff'}</span>
                                        </div>
                                        {(user?.id === note.created_by || profile?.role === 'Admin') && (
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => startEditing(note)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setIsDeleting(note)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-4">
                                        <div
                                            className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: note.note_content }}
                                        />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed border-muted">
                            <History className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                            <p className="text-muted-foreground font-medium">No case notes found</p>
                            <p className="text-sm text-muted-foreground/60">Be the first to add an observation</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isAdding || !!isEditing} onOpenChange={resetForm}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Note' : 'Add New Case Note'}</DialogTitle>
                        <DialogDescription>
                            Record observations, updates, or specific incidents. Use the rich text editor for formatting.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Note Category</Label>
                            <Select value={noteType} onValueChange={setNoteType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {NOTE_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Note Content</Label>
                            <RichTextEditor
                                value={noteContent}
                                onChange={setNoteContent}
                                className="min-h-[200px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={resetForm}>Cancel</Button>
                        <Button onClick={handleSave} disabled={createNote.isPending || updateNote.isPending}>
                            {createNote.isPending || updateNote.isPending ? 'Saving...' : 'Save Note'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Note?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete this case note.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleting(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteNote.isPending}>
                            {deleteNote.isPending ? 'Deleting...' : 'Confirm Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
