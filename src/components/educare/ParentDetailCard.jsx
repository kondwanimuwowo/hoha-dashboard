import { useState } from 'react'
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
    Calendar,
    Users,
    Trash2,
    Edit,
    Plus,
    Search,
    Check,
    X,
    Loader2,
    AlertCircle
} from 'lucide-react'
import { useUpdatePerson, useDeletePerson } from '@/hooks/usePeople'
import { useStudents } from '@/hooks/useStudents'
import { useCreateRelationship } from '@/hooks/useRelationships'
import { toast } from 'sonner'
import { RELATIONSHIP_TYPES } from '@/lib/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function ParentDetailCard({ parent, isOpen, onClose }) {
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isLinking, setIsLinking] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [relationshipType, setRelationshipType] = useState('Mother')
    const [isEmergencyContact, setIsEmergencyContact] = useState(true)

    // Form state for editing
    const [editForm, setEditForm] = useState({
        first_name: parent?.first_name || '',
        last_name: parent?.last_name || '',
        phone_number: parent?.phone_number || '',
        address: parent?.address || '',
        emergency_contact_name: parent?.emergency_contact_name || '',
        emergency_contact_phone: parent?.emergency_contact_phone || '',
        emergency_contact_relationship: parent?.emergency_contact_relationship || ''
    })

    const updatePerson = useUpdatePerson()
    const deletePerson = useDeletePerson()
    const createRelationship = useCreateRelationship()
    const { data: students } = useStudents({ search: searchTerm })

    if (!parent) return null

    const handleUpdate = async () => {
        try {
            await updatePerson.mutateAsync({
                id: parent.id,
                ...editForm
            })
            toast.success('Parent details updated')
            setIsEditing(false)
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
                related_person_id: selectedStudent.id,
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Parent Details
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                        {/* Avatar and Basic Info */}
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <PersonAvatar
                                photoUrl={parent.photo_url}
                                gender={parent.gender}
                                firstName={parent.first_name}
                                lastName={parent.last_name}
                                className="h-24 w-24 border-4 border-muted"
                            />
                            {isEditing ? (
                                <div className="space-y-2 w-full">
                                    <Input
                                        value={editForm.first_name}
                                        onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                        placeholder="First Name"
                                    />
                                    <Input
                                        value={editForm.last_name}
                                        onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                        placeholder="Last Name"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-xl font-bold">{parent.first_name} {parent.last_name}</h2>
                                    <p className="text-sm text-muted-foreground capitalize">{parent.gender}</p>
                                </div>
                            )}

                            <div className="flex flex-col w-full gap-2">
                                {isEditing ? (
                                    <>
                                        <Button onClick={handleUpdate} disabled={updatePerson.isPending}>
                                            {updatePerson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    </>
                                ) : (
                                    <>
                                        <Button onClick={() => setIsEditing(true)} className="w-full">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Profile
                                        </Button>
                                        <Button variant="destructive" onClick={() => setIsDeleting(true)} className="w-full">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Record
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Detailed Info */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase">Phone Number</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.phone_number}
                                            onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{parent.phone_number || 'Not provided'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase">Address</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.address}
                                            onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{parent.address || 'Not provided'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 border-t mt-2">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Emergency Contact for this Parent</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground uppercase">Name</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={editForm.emergency_contact_name}
                                                    onChange={e => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                                                    placeholder="Who to call..."
                                                />
                                            ) : (
                                                <p className="text-sm font-medium">{parent.emergency_contact_name || 'Not provided'}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground uppercase">Phone</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={editForm.emergency_contact_phone}
                                                    onChange={e => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                                                    placeholder="Phone number"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium">{parent.emergency_contact_phone || 'Not provided'}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        <Label className="text-xs text-muted-foreground uppercase">Relationship</Label>
                                        {isEditing ? (
                                            <Input
                                                value={editForm.emergency_contact_relationship}
                                                onChange={e => setEditForm({ ...editForm, emergency_contact_relationship: e.target.value })}
                                                placeholder="e.g. Spouse"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium">{parent.emergency_contact_relationship || 'Not provided'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Children Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground uppercase">Children in Educare</Label>
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
                                            <div key={child.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                    <PersonAvatar
                                                        firstName={child.first_name}
                                                        lastName={child.last_name}
                                                        className="h-8 w-8"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium">{child.first_name} {child.last_name}</p>
                                                        <p className="text-xs text-muted-foreground">{child.relationship}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={child.status === 'Active' ? 'success' : 'secondary'}>
                                                    {child.status}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-center py-4 text-muted-foreground border border-dashed rounded-lg">
                                            No children linked yet
                                        </div>
                                    )}
                                </div>
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
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {searchTerm.length > 1 && (
                            <div className="border rounded-lg max-h-48 overflow-y-auto">
                                {students?.map(student => (
                                    <div
                                        key={student.id}
                                        className={cn(
                                            "flex items-center justify-between p-2 cursor-pointer hover:bg-muted",
                                            selectedStudent?.id === student.id && "bg-primary/10"
                                        )}
                                        onClick={() => setSelectedStudent(student)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <PersonAvatar firstName={student.first_name} lastName={student.last_name} className="h-6 w-6" />
                                            <span className="text-sm">{student.first_name} {student.last_name}</span>
                                        </div>
                                        {selectedStudent?.id === student.id && <Check className="h-4 w-4 text-primary" />}
                                    </div>
                                ))}
                                {students?.length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No students found</div>
                                )}
                            </div>
                        )}

                        {selectedStudent && (
                            <div className="space-y-4 pt-2 border-t">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Relationship</Label>
                                        <Select value={relationshipType} onValueChange={setRelationshipType}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {RELATIONSHIP_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end pb-1.5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={isEmergencyContact}
                                                onChange={(e) => setIsEmergencyContact(e.target.checked)}
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
