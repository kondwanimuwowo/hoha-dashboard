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
import { Loader2, Plus, X, Search, Check } from 'lucide-react'
import { GRADE_LEVELS, RELATIONSHIP_TYPES } from '@/lib/constants'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { SchoolDropdown } from '@/components/shared/SchoolDropdown'
import { useState, useEffect } from 'react'

const studentSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    gender: z.string().min(1, 'Gender is required'),
    phone_number: z.string().optional(),
    address: z.string().optional(),
    compound_area: z.string().optional(),
    photo_url: z.string().optional(),
    grade_level: z.string().min(1, 'Grade level is required'),
    government_school_id: z.string().optional(),
    enrollment_date: z.string().optional(),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    emergency_contact_relationship: z.string().optional(),
    notes: z.string().optional(),
})

export function StudentForm({ onSuccess, onCancel, initialData }) {
    const [error, setError] = useState('')
    const [guardians, setGuardians] = useState([{ first_name: '', last_name: '', phone_number: '', relationship: 'Mother', linked_person_id: null }])
    const [sameAsParent, setSameAsParent] = useState(false)
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
            enrollment_date: new Date().toISOString().split('T')[0],
        },
    })

    useEffect(() => {
        if (initialData) {
            setValue('first_name', initialData.first_name)
            setValue('last_name', initialData.last_name)
            setValue('date_of_birth', initialData.date_of_birth)
            setValue('gender', initialData.gender)
            setValue('phone_number', initialData.phone_number)
            setValue('address', initialData.address)
            setValue('compound_area', initialData.compound_area)
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

    const handleSameAsParentChange = (checked) => {
        setSameAsParent(checked)
        if (checked && guardians[0]) {
            setValue('emergency_contact_name', `${guardians[0].first_name} ${guardians[0].last_name}`.trim())
            setValue('emergency_contact_phone', guardians[0].phone_number)
            setValue('emergency_contact_relationship', guardians[0].relationship)
        } else if (!checked) {
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
                    ...data
                })
                onSuccess?.()
                return
            }

            // Create student (person + enrollment)
            const student = await createStudent.mutateAsync(data)

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

                    // Create relationship
                    await createRelationship.mutateAsync({
                        person_id: student.child_id || student.id, // Handle different return structures
                        related_person_id: guardianId,
                        relationship_type: guardian.relationship,
                        is_primary: guardians.indexOf(guardian) === 0,
                    })
                }
            }

            onSuccess?.()
        } catch (err) {
            setError(err.message || 'Failed to save student')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                            id="phone_number"
                            {...register('phone_number')}
                            placeholder="+260 XXX XXXX"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="compound_area">Compound Area</Label>
                        <Input
                            id="compound_area"
                            {...register('compound_area')}
                            placeholder="e.g., Kanyama"
                        />
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



            {/* Parent/Guardian Information - Only show in create mode */}
            {
                !initialData && (
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
                )
            }

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
                        />
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
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="same_as_parent"
                            checked={sameAsParent}
                            onCheckedChange={handleSameAsParentChange}
                        />
                        <Label htmlFor="same_as_parent" className="cursor-pointer text-sm">
                            Same as Parent/Guardian
                        </Label>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Contact Name</Label>
                        <Input
                            id="emergency_contact_name"
                            {...register('emergency_contact_name')}
                            placeholder="Full name"
                            disabled={sameAsParent}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                        <Input
                            id="emergency_contact_phone"
                            {...register('emergency_contact_phone')}
                            placeholder="+260 XXX XXXX"
                            disabled={sameAsParent}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                    <Select
                        onValueChange={(value) => setValue('emergency_contact_relationship', value)}
                        disabled={sameAsParent}
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