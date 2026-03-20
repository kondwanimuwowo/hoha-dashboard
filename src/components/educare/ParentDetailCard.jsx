import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import {
    Phone,
    MapPin,
    Users,
    Trash2,
    Edit,
    Plus,
    Search,
    Check,
    X,
    Loader2,
    AlertCircle,
    ChevronRight,
    ShieldAlert
} from 'lucide-react'
import { useUpdatePerson, useDeletePerson } from '@/hooks/usePeople'
import { useStudents } from '@/hooks/useStudents'
import { useCreateRelationship, useDeleteRelationship } from '@/hooks/useRelationships'
import { toast } from 'sonner'
import { RELATIONSHIP_TYPES } from '@/lib/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

function InfoRow({ icon: Icon, label, value, iconClass, children }) {
    return (
        <div className="flex items-start gap-3 py-2.5">
            <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconClass || 'bg-neutral-100 text-neutral-500')}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                {children || <p className="mt-0.5 font-medium text-foreground">{value || 'Not provided'}</p>}
            </div>
        </div>
    )
}

export function ParentDetailCard({ parent, isOpen, onClose }) {
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isLinking, setIsLinking] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [relationshipType, setRelationshipType] = useState('Mother')
    const [isEmergencyContact, setIsEmergencyContact] = useState(true)

    const [editForm, setEditForm] = useState(null)

    const updatePerson = useUpdatePerson()
    const deletePerson = useDeletePerson()
    const createRelationship = useCreateRelationship()
    const deleteRelationship = useDeleteRelationship()
    const { data: students } = useStudents({ search: searchTerm })

    if (!parent) return null

    const hasEmergencyContact =
        !!parent.emergency_contact_name ||
        !!parent.emergency_contact_phone ||
        !!parent.emergency_contact_relationship

    const startEditing = () => {
        setEditForm({
            first_name: parent.first_name || '',
            last_name: parent.last_name || '',
            phone_number: parent.phone_number || '',
            address: parent.address || '',
            emergency_contact_name: parent.emergency_contact_name || '',
            emergency_contact_phone: parent.emergency_contact_phone || '',
            emergency_contact_relationship: parent.emergency_contact_relationship || ''
        })
        setIsEditing(true)
    }

    const stopEditing = () => {
        setIsEditing(false)
        setEditForm(null)
    }

    const handleUpdate = async () => {
        try {
            await updatePerson.mutateAsync({
                id: parent.id,
                ...editForm
            })
            toast.success('Parent details updated')
            stopEditing()
        } catch (error) {
            toast.error('Failed to update: ' + error.message)
        }
    }

    const handleDelete = async () => {
        try {
            await deletePerson.mutateAsync(parent.id)
            toast.success('Parent record deleted')
            onClose()
        } catch (error) {
            toast.error('Failed to delete: ' + error.message)
        }
    }

    const handleLinkStudent = async () => {
        if (!selectedStudent) return
        try {
            await createRelationship.mutateAsync({
                person_id: parent.id,
                related_person_id: selectedStudent.person_id,
                relationship_type: relationshipType,
                is_primary: false,
                is_emergency_contact: isEmergencyContact
            })
            toast.success(`Linked ${selectedStudent.first_name} to ${parent.first_name}`)
            setIsLinking(false)
            setSelectedStudent(null)
            setSearchTerm('')
        } catch (error) {
            toast.error('Failed to link: ' + error.message)
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                    {/* Header with gradient accent */}
                    <div className="relative">
                        <div className="h-2 bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 rounded-t-lg" />
                        <div className="p-6 pb-4">
                            <div className="flex items-start gap-4">
                                <PersonAvatar
                                    photoUrl={parent.photo_url}
                                    gender={parent.gender}
                                    firstName={parent.first_name}
                                    lastName={parent.last_name}
                                    className="h-16 w-16 border-2 border-indigo-100 shadow-sm"
                                />
                                <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <Input
                                                value={editForm?.first_name || ''}
                                                onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                                placeholder="First Name"
                                                className="h-9"
                                            />
                                            <Input
                                                value={editForm?.last_name || ''}
                                                onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                                placeholder="Last Name"
                                                className="h-9"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-xl font-bold text-foreground tracking-tight">
                                                {parent.first_name} {parent.last_name}
                                            </h2>
                                            <p className="text-sm text-muted-foreground capitalize">{parent.gender}</p>
                                        </>
                                    )}
                                    <div className="mt-2 flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <Button size="sm" onClick={handleUpdate} disabled={updatePerson.isPending}>
                                                    {updatePerson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={stopEditing}>Cancel</Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button size="sm" variant="outline" onClick={startEditing}>
                                                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                                                    Edit
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => setIsDeleting(true)}>
                                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content sections */}
                    <div className="px-6 pb-6 space-y-5">

                        {/* Contact Info */}
                        <div className="space-y-0">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground uppercase">Phone Number</Label>
                                        <Input
                                            value={editForm?.phone_number || ''}
                                            onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                                            placeholder="Phone number"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground uppercase">Address</Label>
                                        <Input
                                            value={editForm?.address || ''}
                                            onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                            placeholder="Address"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <InfoRow icon={Phone} label="Phone" value={parent.phone_number} iconClass="bg-green-50 text-green-500" />
                                    <InfoRow icon={MapPin} label="Address" value={parent.address} iconClass="bg-orange-50 text-orange-500" />
                                </>
                            )}
                        </div>

                        {/* Emergency Contact */}
                        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldAlert className="h-4 w-4 text-amber-600" />
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Emergency Contact</span>
                            </div>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Name</Label>
                                            <Input
                                                value={editForm?.emergency_contact_name || ''}
                                                onChange={e => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                                                placeholder="Who to call..."
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Phone</Label>
                                            <Input
                                                value={editForm?.emergency_contact_phone || ''}
                                                onChange={e => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                                                placeholder="Phone number"
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Relationship</Label>
                                        <Input
                                            value={editForm?.emergency_contact_relationship || ''}
                                            onChange={e => setEditForm({ ...editForm, emergency_contact_relationship: e.target.value })}
                                            placeholder="e.g. Spouse"
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            ) : hasEmergencyContact ? (
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-amber-700/70">Name</p>
                                        <p className="font-medium text-foreground">{parent.emergency_contact_name || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-amber-700/70">Phone</p>
                                        <p className="font-medium text-foreground">{parent.emergency_contact_phone || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-amber-700/70">Relationship</p>
                                        <p className="font-medium text-foreground">{parent.emergency_contact_relationship || '—'}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-amber-700/60 italic">No emergency contact saved</p>
                            )}
                        </div>

                        {/* Children Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    <span className="text-sm font-semibold text-foreground">Children in Educare</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setIsLinking(true)}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Link Child
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {parent.educare_children?.length > 0 ? (
                                    parent.educare_children.map(child => (
                                        <div
                                            key={child.id}
                                            className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-accent group"
                                        >
                                            <button
                                                type="button"
                                                className="flex-1 text-left flex items-center gap-3"
                                                onClick={() => {
                                                    onClose()
                                                    navigate(`/educare/students/${child.id}`)
                                                }}
                                            >
                                                <PersonAvatar
                                                    firstName={child.first_name}
                                                    lastName={child.last_name}
                                                    gender={child.gender}
                                                    className="h-9 w-9"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {child.first_name} {child.last_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{child.relationship}</p>
                                                </div>
                                            </button>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant={child.status === 'Active' ? 'success' : 'secondary'} className="text-[10px]">
                                                    {child.status}
                                                </Badge>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        if (window.confirm(`Unlink ${child.first_name} from this parent?`)) {
                                                            try {
                                                                await deleteRelationship.mutateAsync({
                                                                    personId: parent.id,
                                                                    relatedPersonId: child.id
                                                                })
                                                                toast.success('Child unlinked successfully')
                                                            } catch (err) {
                                                                toast.error('Failed to unlink: ' + err.message)
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-6 text-center">
                                        <Users className="h-8 w-8 text-neutral-300 mb-2" />
                                        <p className="text-sm text-muted-foreground">No children linked yet</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2 text-xs"
                                            onClick={() => setIsLinking(true)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Link a child
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Verification */}
            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Delete Parent Record
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {parent.first_name} {parent.last_name}? This will mark the record as deleted and hide it from the dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleting(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deletePerson.isPending}>
                            {deletePerson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Link Child Search */}
            <Dialog open={isLinking} onOpenChange={setIsLinking}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Link a Child</DialogTitle>
                        <DialogDescription>
                            Search for a student to link to {parent.first_name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {searchTerm.length > 1 && (
                            <div className="border rounded-xl max-h-48 overflow-y-auto divide-y">
                                {students?.map(student => (
                                    <button
                                        key={student.id}
                                        type="button"
                                        className={cn(
                                            "flex w-full items-center justify-between p-2.5 text-left transition-colors hover:bg-muted",
                                            selectedStudent?.id === student.id && "bg-primary/5"
                                        )}
                                        onClick={() => setSelectedStudent(student)}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <PersonAvatar firstName={student.first_name} lastName={student.last_name} gender={student.gender} className="h-7 w-7" />
                                            <div>
                                                <span className="text-sm font-medium">{student.first_name} {student.last_name}</span>
                                                {student.grade_level && (
                                                    <span className="ml-2 text-xs text-muted-foreground">{student.grade_level}</span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedStudent?.id === student.id && <Check className="h-4 w-4 text-primary" />}
                                    </button>
                                ))}
                                {students?.length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No students found</div>
                                )}
                            </div>
                        )}

                        {selectedStudent && (
                            <div className="space-y-3 pt-3 border-t">
                                <div className="flex items-center gap-2.5 rounded-lg bg-primary/5 p-2.5">
                                    <PersonAvatar firstName={selectedStudent.first_name} lastName={selectedStudent.last_name} className="h-8 w-8" />
                                    <span className="text-sm font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Relationship</Label>
                                        <Select value={relationshipType} onValueChange={setRelationshipType}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {RELATIONSHIP_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox
                                                checked={isEmergencyContact}
                                                onCheckedChange={(checked) => setIsEmergencyContact(!!checked)}
                                            />
                                            <span className="text-xs font-medium">Emergency Contact</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLinking(false)}>Cancel</Button>
                        <Button
                            disabled={!selectedStudent || createRelationship.isPending}
                            onClick={handleLinkStudent}
                        >
                            {createRelationship.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Link Child'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
