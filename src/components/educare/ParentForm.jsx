import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreatePerson } from '@/hooks/usePeople'
import { useCreateRelationship } from '@/hooks/useRelationships'
import { useStudents } from '@/hooks/useStudents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, Check, X, Users, UserPlus } from 'lucide-react'
import { RELATIONSHIP_TYPES } from '@/lib/constants'
import { useState } from 'react'
import { PersonAvatar } from '@/components/shared/PersonAvatar'

const parentSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    phone_number: z.string().min(5, 'Valid phone number is required'),
    gender: z.enum(['Male', 'Female', 'Other']),
    address: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    emergency_contact_name: z.string().nullable().optional(),
    emergency_contact_phone: z.string().nullable().optional(),
    emergency_contact_relationship: z.string().nullable().optional(),
})

export function ParentForm({ onSuccess, onCancel }) {
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [linkedStudents, setLinkedStudents] = useState([]) // Array of { id, first_name, last_name, relationship_type, is_emergency }

    const createPerson = useCreatePerson()
    const createRelationship = useCreateRelationship()
    const { data: studentSearchResults } = useStudents({ search: searchTerm })

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(parentSchema),
        defaultValues: {
            gender: 'Female',
        },
    })

    const addStudentLink = (student) => {
        if (linkedStudents.find(s => s.id === student.id)) return
        setLinkedStudents([...linkedStudents, { ...student, relationship_type: 'Mother', is_emergency: true }])
        setSearchTerm('')
    }

    const removeStudentLink = (id) => {
        setLinkedStudents(linkedStudents.filter(s => s.id !== id))
    }

    const updateRelationship = (id, updates) => {
        setLinkedStudents(linkedStudents.map(s =>
            s.id === id ? { ...s, ...updates } : s
        ))
    }

    const onSubmit = async (data) => {
        setError('')
        try {
            // 1. Create the person record for the parent
            const parent = await createPerson.mutateAsync(data)

            // 2. Create relationships for all linked students
            if (linkedStudents.length > 0) {
                for (const student of linkedStudents) {
                    await createRelationship.mutateAsync({
                        person_id: parent.id,
                        related_person_id: student.id,
                        relationship_type: student.relationship_type,
                        is_primary: linkedStudents.indexOf(student) === 0, // Mark first as primary by default
                        is_emergency_contact: student.is_emergency
                    })
                }
            }

            onSuccess?.()
        } catch (err) {
            setError(err.message || 'Failed to create parent record')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Parent Information
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input id="first_name" {...register('first_name')} placeholder="First name" />
                                {errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name *</Label>
                                <Input id="last_name" {...register('last_name')} placeholder="Last name" />
                                {errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="phone_number">Phone Number *</Label>
                                <Input id="phone_number" {...register('phone_number')} placeholder="+260..." />
                                {errors.phone_number && <p className="text-xs text-red-600">{errors.phone_number.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender *</Label>
                                <Select onValueChange={(v) => setValue('gender', v)} defaultValue="Female">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" {...register('address')} placeholder="Full address" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Emergency Contact for this Parent
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_name">Name</Label>
                                <Input id="emergency_contact_name" {...register('emergency_contact_name')} placeholder="Who to call..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_phone">Phone</Label>
                                <Input id="emergency_contact_phone" {...register('emergency_contact_phone')} placeholder="Phone number" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_relationship">Relationship to Parent</Label>
                            <Input id="emergency_contact_relationship" {...register('emergency_contact_relationship')} placeholder="e.g. Spouse, Brother" />
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" {...register('notes')} placeholder="Any additional notes..." rows={2} />
                    </div>
                </div>

                {/* Linking Students */}
                <div className="space-y-4 border-l pl-4 md:border-l md:pl-8">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Link Children (Educare)
                    </h3>

                    <p className="text-xs text-muted-foreground">
                        Select children to link to this parent. You can also designate this parent as their primary emergency contact.
                    </p>

                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students to link..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {searchTerm.length > 1 && studentSearchResults && (
                            <div className="absolute z-10 w-full mt-1 bg-popover border text-popover-foreground rounded-md shadow-md max-h-48 overflow-y-auto">
                                {studentSearchResults.length > 0 ? (
                                    studentSearchResults.map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted"
                                            onClick={() => addStudentLink(student)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <PersonAvatar firstName={student.first_name} lastName={student.last_name} className="h-6 w-6" />
                                                <span className="text-sm">{student.first_name} {student.last_name}</span>
                                            </div>
                                            <Check className="h-4 w-4 opacity-50" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-muted-foreground text-center">No students found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {linkedStudents.length > 0 ? (
                            linkedStudents.map((student) => (
                                <div key={student.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <PersonAvatar firstName={student.first_name} lastName={student.last_name} className="h-8 w-8" />
                                            <span className="text-sm font-medium">{student.first_name} {student.last_name}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeStudentLink(student.id)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Relationship</Label>
                                            <Select
                                                value={student.relationship_type}
                                                onValueChange={(v) => updateRelationship(student.id, { relationship_type: v })}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RELATIONSHIP_TYPES.map(type => (
                                                        <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end pb-1.5">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    checked={student.is_emergency}
                                                    onChange={(e) => updateRelationship(student.id, { is_emergency: e.target.checked })}
                                                />
                                                <span className="text-xs font-medium">Emergency Contact</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                                No children linked. Search above to link students.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={createPerson.isPending}>
                    Cancel
                </Button>
                <Button type="submit" disabled={createPerson.isPending}>
                    {createPerson.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                        </>
                    ) : (
                        'Register Parent'
                    )}
                </Button>
            </div>
        </form>
    )
}
