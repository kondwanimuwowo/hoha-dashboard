import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateStudent, useUpdateStudent } from '@/hooks/useStudents'
import { useCreatePerson, usePeople } from '@/hooks/usePeople'
import { useCreateRelationship } from '@/hooks/useRelationships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, X, Search, Check, Phone, MapPin, Calendar, School, Users as UsersIcon, Trash2, ShieldQuestion } from 'lucide-react'
import { GRADE_LEVELS, RELATIONSHIP_TYPES } from '@/lib/constants'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { SchoolDropdown } from '@/components/shared/SchoolDropdown'
import { useState, useEffect } from 'react'


const studentSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['Male', 'Female']),
    address: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
    grade_level: z.string().min(1, 'Grade level is required'),
    government_school_id: z.string().nullable().optional(),
    enrollment_date: z.string().nullable().optional(),
    emergency_contact_name: z.string().nullable().optional(),
    emergency_contact_phone: z.string().nullable().optional(),
    emergency_contact_relationship: z.string().nullable().optional(),
    current_status: z.string().default('Active'),
    notes: z.string().nullable().optional(),
})

export function StudentForm({ onSuccess, onCancel, initialData }) {
    const [error, setError] = useState('')
    const [guardians, setGuardians] = useState([{ first_name: '', last_name: '', phone_number: '', relationship: 'Mother', linked_person_id: null }])
    const [sameAsParent] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [activeGuardianIndex, setActiveGuardianIndex] = useState(0)

    const createStudent = useCreateStudent()
    const updateStudent = useUpdateStudent()
    const createPerson = useCreatePerson()
    const createRelationship = useCreateRelationship()
    const { data: searchResults } = usePeople(searchTerm)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            // No default enrollment_date - can be left blank if unknown
        },
    })


    useEffect(() => {
        if (initialData) {
            setValue('first_name', initialData.first_name)
            setValue('last_name', initialData.last_name)
            setValue('date_of_birth', initialData.date_of_birth)
            setValue('gender', initialData.gender)
            setValue('address', initialData.address)
            setValue('photo_url', initialData.photo_url)
            setValue('notes', initialData.notes)
            setValue('emergency_contact_name', initialData.emergency_contact_name)
            setValue('emergency_contact_phone', initialData.emergency_contact_phone)
            setValue('emergency_contact_relationship', initialData.emergency_contact_relationship)

            if (initialData.educare_enrollment?.[0]) {
                const enrollment = initialData.educare_enrollment[0]
                setValue('grade_level', enrollment.grade_level)
                setValue('government_school_id', enrollment.government_school_id)
                setValue('enrollment_date', enrollment.enrollment_date)
                setValue('current_status', enrollment.current_status || 'Active')
            }

            if (initialData.relationships) {
                const existingGuardians = initialData.relationships.map(rel => ({
                    first_name: rel.related_person?.first_name || '',
                    last_name: rel.related_person?.last_name || '',
                    phone_number: rel.related_person?.phone_number || '',
                    relationship: rel.relationship_type,
                    linked_person_id: rel.related_person_id,
                    relationship_id: rel.id
                }))
                if (existingGuardians.length > 0) {
                    setGuardians(existingGuardians)
                }
            } else if (initialData['relationships!relationships_related_person_id_fkey']) {
                const rels = initialData['relationships!relationships_related_person_id_fkey']
                const existingGuardians = rels.map(rel => ({
                    first_name: rel.person?.first_name || '',
                    last_name: rel.person?.last_name || '',
                    phone_number: rel.person?.phone_number || '',
                    relationship: rel.relationship_type,
                    linked_person_id: rel.person_id,
                    relationship_id: rel.id
                }))
                if (existingGuardians.length > 0) {
                    setGuardians(existingGuardians)
                }
            }
        }
    }, [initialData, setValue])

    const selectedGrade = watch('grade_level')
    const showSchoolSelect = selectedGrade &&
        selectedGrade !== 'Early Childhood Program' &&
        selectedGrade !== 'Preparatory Program'

    const addGuardian = () => {
        setGuardians([...guardians, { first_name: '', last_name: '', phone_number: '', relationship: 'Father', linked_person_id: null }])
    }

    const linkGuardian = (person) => {
        const updated = [...guardians]
        updated[activeGuardianIndex] = {
            first_name: person.first_name,
            last_name: person.last_name,
            phone_number: person.phone_number,
            relationship: updated[activeGuardianIndex].relationship,
            linked_person_id: person.id
        }
        setGuardians(updated)
        setSearchTerm('')
        setShowSuggestions(false)
    }

    const removeGuardian = (index) => {
        if (guardians.length > 1) {
            setGuardians(guardians.filter((_, i) => i !== index))
        }
    }

    const updateGuardian = (index, field, value) => {
        const updated = [...guardians]
        updated[index][field] = value
        setGuardians(updated)

        // If "same as parent" is checked and this is the first guardian, update emergency contact
        if (sameAsParent && index === 0) {
            if (field === 'first_name' || field === 'last_name') {
                setValue('emergency_contact_name', `${updated[0].first_name} ${updated[0].last_name}`.trim())
            } else if (field === 'phone_number') {
                setValue('emergency_contact_phone', value)
            } else if (field === 'relationship') {
                setValue('emergency_contact_relationship', value)
            }
        }
    }

    const handleEmergencyContactSelection = (index, isChecked) => {
        const updated = guardians.map((g, i) => ({
            ...g,
            is_emergency_contact: i === index ? isChecked : false // Only one primary emergency contact from guardians
        }))
        setGuardians(updated)

        if (isChecked) {
            const guardian = updated[index]
            // If they have emergency contact info on their record, we could show it
            // but the user wants to "avoid instances of me entering a parent and then their emergency"
            // So if they ARE the emergency contact, the fields should actually represent THEIR info
            setValue('emergency_contact_name', `${guardian.first_name} ${guardian.last_name}`.trim())
            setValue('emergency_contact_phone', guardian.phone_number)
            setValue('emergency_contact_relationship', guardian.relationship)
        } else {
            setValue('emergency_contact_name', '')
            setValue('emergency_contact_phone', '')
            setValue('emergency_contact_relationship', '')
        }
    }

    const onSubmit = async (data) => {
        setError('')
        try {
            if (initialData) {
                await updateStudent.mutateAsync({
                    id: initialData.id,
                    ...data,
                    current_status: data.current_status || initialData.educare_enrollment?.[0]?.current_status
                })

                const studentId = initialData.id
                for (const guardian of guardians) {
                    if (guardian.first_name && guardian.last_name) {
                        let guardianId = guardian.linked_person_id

                        if (!guardianId) {
                            const guardianPerson = await createPerson.mutateAsync({
                                first_name: guardian.first_name,
                                last_name: guardian.last_name,
                                phone_number: guardian.phone_number,
                            })
                            guardianId = guardianPerson.id
                        }

                        if (!guardian.relationship_id) {
                            await createRelationship.mutateAsync({
                                person_id: guardianId,
                                related_person_id: studentId,
                                relationship_type: guardian.relationship,
                                is_primary: guardians.indexOf(guardian) === 0,
                                is_emergency_contact: guardian.is_emergency_contact || false
                            })
                        }
                    }
                }

                onSuccess?.()
                return
            }

            // Create student
            const student = await createStudent.mutateAsync(data)
            const studentId = student.child_id || student.id

            // Create guardians and relationships
            for (const guardian of guardians) {
                if (guardian.first_name && guardian.last_name) {
                    let guardianId = guardian.linked_person_id

                    if (!guardianId) {
                        const guardianPerson = await createPerson.mutateAsync({
                            first_name: guardian.first_name,
                            last_name: guardian.last_name,
                            phone_number: guardian.phone_number,
                        })
                        guardianId = guardianPerson.id
                    }

                    await createRelationship.mutateAsync({
                        person_id: guardianId,
                        related_person_id: studentId,
                        relationship_type: guardian.relationship,
                        is_primary: guardians.indexOf(guardian) === 0,
                        is_emergency_contact: guardian.is_emergency_contact || false
                    })
                }
            }

            onSuccess?.()
        } catch (err) {
            setError(err.message || 'Failed to save student')
        }
    }
    const onError = (errors) => {
        console.error('Form Validation Errors:', errors)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <div className="space-y-2">
                    <Label>Photo</Label>
                    <PhotoUpload
                        value={watch('photo_url')}
                        onChange={(url) => setValue('photo_url', url)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                            id="first_name"
                            {...register('first_name')}
                            placeholder="John"
                        />
                        {errors.first_name && (
                            <p className="text-sm text-red-600">{errors.first_name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                            id="last_name"
                            {...register('last_name')}
                            placeholder="Doe"
                        />
                        {errors.last_name && (
                            <p className="text-sm text-red-600">{errors.last_name.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth *</Label>
                        <Input
                            id="date_of_birth"
                            type="date"
                            {...register('date_of_birth')}
                        />
                        {errors.date_of_birth && (
                            <p className="text-sm text-red-600">{errors.date_of_birth.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select
                            onValueChange={(value) => setValue('gender', value)}
                            defaultValue={initialData?.gender}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.gender && (
                            <p className="text-sm text-red-600">{errors.gender.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                        id="address"
                        {...register('address')}
                        placeholder="Full address"
                        rows={2}
                    />
                </div>
            </div>



            {/* Parent/Guardian Information */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addGuardian}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Guardian
                    </Button>
                </div>

                {guardians.map((guardian, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Guardian {index + 1}</Label>
                            {guardians.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeGuardian(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Search for existing parent */}
                        <div className="relative mb-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search existing parent..."
                                    className="pl-8"
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setActiveGuardianIndex(index)
                                        setShowSuggestions(true)
                                    }}
                                    onFocus={() => {
                                        setActiveGuardianIndex(index)
                                        setShowSuggestions(true)
                                    }}
                                />
                            </div>
                            {showSuggestions && activeGuardianIndex === index && searchTerm.length > 1 && searchResults && (
                                <div className="absolute z-10 w-full mt-1 bg-popover border text-popover-foreground rounded-md shadow-md max-h-48 overflow-y-auto">
                                    {searchResults.length > 0 ? (
                                        searchResults.map((person) => (
                                            <div
                                                key={person.id}
                                                className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted"
                                                onClick={() => linkGuardian(person)}
                                            >
                                                <div>
                                                    <p className="font-medium">{person.first_name} {person.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{person.phone_number}</p>
                                                </div>
                                                <Check className="h-4 w-4 opacity-50" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-muted-foreground">No matches found. Create new below.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {guardian.linked_person_id && (
                            <Alert className="mb-2 bg-green-500/10 border-green-500/20">
                                <Check className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-700 dark:text-green-400">
                                    Linked to existing record
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                placeholder="First Name"
                                value={guardian.first_name}
                                onChange={(e) => updateGuardian(index, 'first_name', e.target.value)}
                                disabled={!!guardian.linked_person_id}
                            />
                            <Input
                                placeholder="Last Name"
                                value={guardian.last_name}
                                onChange={(e) => updateGuardian(index, 'last_name', e.target.value)}
                                disabled={!!guardian.linked_person_id}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                placeholder="Phone Number"
                                value={guardian.phone_number}
                                onChange={(e) => updateGuardian(index, 'phone_number', e.target.value)}
                                disabled={!!guardian.linked_person_id}
                            />
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`is_emergency_${index}`}
                                    checked={!!guardian.is_emergency_contact}
                                    onCheckedChange={(checked) => handleEmergencyContactSelection(index, checked)}
                                />
                                <Label htmlFor={`is_emergency_${index}`} className="text-xs cursor-pointer">
                                    Emergency Contact
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Relationship</Label>
                            <Select
                                value={guardian.relationship}
                                onValueChange={(value) => updateGuardian(index, 'relationship', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Relationship" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RELATIONSHIP_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ))}
            </div>

            {/* Education Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Education Information</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="grade_level">Grade Level *</Label>
                        <Select
                            onValueChange={(value) => setValue('grade_level', value)}
                            defaultValue={initialData?.educare_enrollment?.[0]?.grade_level}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                {GRADE_LEVELS.map((grade) => (
                                    <SelectItem key={grade} value={grade}>
                                        {grade}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.grade_level && (
                            <p className="text-sm text-red-600">{errors.grade_level.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="enrollment_date">Enrollment Date</Label>
                        <Input
                            id="enrollment_date"
                            type="date"
                            {...register('enrollment_date')}
                            placeholder="Leave blank if unknown"
                        />
                        <p className="text-xs text-muted-foreground">Leave blank if enrollment date is unknown</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="current_status">Status</Label>
                        <Select
                            onValueChange={(value) => setValue('current_status', value)}
                            defaultValue={initialData?.educare_enrollment?.[0]?.current_status || 'Active'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Graduated">Graduated</SelectItem>
                                <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                                <SelectItem value="Transferred">Transferred</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {showSchoolSelect && (
                    <div className="space-y-2">
                        <Label htmlFor="government_school_id">Government School</Label>
                        <SchoolDropdown
                            value={watch('government_school_id')}
                            onChange={(value) => setValue('government_school_id', value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            The government school the student attends for formal education
                        </p>
                    </div>
                )}
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Emergency Contact</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <Label className="text-sm text-muted-foreground italic">
                            Select a parent/guardian above to mark as the emergency contact, or enter manual details below.
                        </Label>

                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_name">Contact Name</Label>
                            <Input
                                id="emergency_contact_name"
                                {...register('emergency_contact_name')}
                                placeholder="Full name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                            <Input
                                id="emergency_contact_phone"
                                {...register('emergency_contact_phone')}
                                placeholder="+260 XXX XXXX"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                            <Select
                                onValueChange={(value) => setValue('emergency_contact_relationship', value)}
                                value={watch('emergency_contact_relationship')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RELATIONSHIP_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="bg-muted/20 border rounded-lg p-4 space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <ShieldQuestion className="h-4 w-4" />
                            Linked Parent Info
                        </h4>

                        {guardians.some(g => g.is_emergency_contact) ? (
                            <div className="space-y-2 text-sm">
                                {guardians.filter(g => g.is_emergency_contact).map((g, i) => (
                                    <div key={i} className="p-2 bg-primary/10 rounded border border-primary/20">
                                        <p className="font-semibold text-primary">{g.first_name} {g.last_name}</p>
                                        <p className="text-xs text-muted-foreground">Will be marked as primary emergency contact</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">No parent linked as emergency contact yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Any additional information about the student..."
                    rows={3}
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={createStudent.isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={createStudent.isPending || updateStudent.isPending}>
                    {(createStudent.isPending || updateStudent.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Update Student' : 'Register Student'}
                </Button>
            </div>
        </form >
    )
}
