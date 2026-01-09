import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateWoman, useUpdateWoman } from '@/hooks/useWomen'
import { usePeople } from '@/hooks/usePeople'
import { useCreateRelationship } from '@/hooks/useRelationships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, X, Check, Save } from 'lucide-react'
import { LEGACY_STAGES } from '@/lib/constants'
import { PhotoUpload } from '@/components/shared/PhotoUpload'
import { NRCInput } from '@/components/shared/NRCInput'
import { useEffect } from 'react'

const womanSchema = z.object({
    // If existing person
    woman_id: z.string().nullable().optional(),

    // If new person
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    compound_area: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
    nrc_number: z.string().nullable().optional(),
    case_notes: z.string().nullable().optional(),

    // Program enrollment
    stage: z.string().min(1, 'Stage is required'),
    enrollment_date: z.string().nullable().optional(),
    status: z.string().default('Active'),
    notes: z.string().nullable().optional(),
})

export function WomenForm({ onSuccess, onCancel, initialData }) {
    const [error, setError] = useState('')
    const [isNewPerson, setIsNewPerson] = useState(!initialData)
    const [searchQuery, setSearchQuery] = useState('')
    const [linkedChildren, setLinkedChildren] = useState([])
    const [childSearchQuery, setChildSearchQuery] = useState('')

    const createWoman = useCreateWoman()
    const updateWoman = useUpdateWoman()
    const createRelationship = useCreateRelationship()
    const { data: people } = usePeople(searchQuery)
    const { data: students } = usePeople(childSearchQuery)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(womanSchema),
        defaultValues: initialData ? {
            stage: initialData.stage,
            enrollment_date: initialData.enrollment_date,
            status: initialData.status,
            notes: initialData.notes,
        } : {
            enrollment_date: new Date().toISOString().split('T')[0],
            status: 'Active',
        },
    })

    useEffect(() => {
        if (initialData && initialData.woman) {
            const woman = initialData.woman
            setValue('first_name', woman.first_name)
            setValue('last_name', woman.last_name)
            setValue('date_of_birth', woman.date_of_birth)
            setValue('phone_number', woman.phone_number)
            setValue('address', woman.address)
            setValue('compound_area', woman.compound_area)
            setValue('photo_url', woman.photo_url)
            setValue('nrc_number', woman.nrc_number)

            if (initialData.children) {
                setLinkedChildren(initialData.children.map(rel => rel.child).filter(Boolean))
            }
        }
    }, [initialData, setValue])

    const addChild = (child) => {
        if (!linkedChildren.find(c => c.id === child.id)) {
            setLinkedChildren([...linkedChildren, child])
        }
        setChildSearchQuery('')
    }

    const removeChild = (childId) => {
        setLinkedChildren(linkedChildren.filter(c => c.id !== childId))
    }

    const onSubmit = async (data) => {
        setError('')
        try {
            if (initialData) {
                await updateWoman.mutateAsync({
                    id: initialData.id,
                    ...data
                })
                onSuccess?.()
                return
            }

            // Create woman (person + enrollment)
            const woman = await createWoman.mutateAsync(data)
            const womanId = woman.woman_id

            // Link children if any
            for (const child of linkedChildren) {
                await createRelationship.mutateAsync({
                    person_id: child.id,
                    related_person_id: womanId,
                    relationship_type: 'Mother',
                    is_primary: true,
                })
            }

            onSuccess?.()
        } catch (err) {
            setError(err.message || 'Failed to save participant')
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

            {/* Choose existing or new */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Participant</h3>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={isNewPerson ? 'default' : 'outline'}
                        onClick={() => setIsNewPerson(true)}
                        className="flex-1"
                    >
                        New Person
                    </Button>
                    <Button
                        type="button"
                        variant={!isNewPerson ? 'default' : 'outline'}
                        onClick={() => setIsNewPerson(false)}
                        className="flex-1"
                    >
                        Existing Person
                    </Button>
                </div>

                {!isNewPerson && (
                    <div className="space-y-2">
                        <Label>Search for existing person</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {people && people.length > 0 && (
                            <div className="max-h-48 overflow-y-auto border rounded-lg">
                                {people.map((person) => (
                                    <button
                                        key={person.id}
                                        type="button"
                                        onClick={() => {
                                            setValue('woman_id', person.id)
                                            setSearchQuery(`${person.first_name} ${person.last_name}`)
                                        }}
                                        className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                                    >
                                        <div className="font-medium">{person.first_name} {person.last_name}</div>
                                        <div className="text-sm text-muted-foreground">{person.phone_number}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* New person form */}
            {isNewPerson && (
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
                                placeholder="Grace"
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
                                placeholder="Kabwe"
                            />
                            {errors.last_name && (
                                <p className="text-sm text-red-600">{errors.last_name.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date_of_birth">Date of Birth</Label>
                            <Input
                                id="date_of_birth"
                                type="date"
                                {...register('date_of_birth')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone_number">Phone Number</Label>
                            <Input
                                id="phone_number"
                                {...register('phone_number')}
                                placeholder="+260 XXX XXXX"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nrc_number">NRC Number</Label>
                            <NRCInput
                                id="nrc_number"
                                value={watch('nrc_number')}
                                onChange={(value) => setValue('nrc_number', value)}
                            />
                            <p className="text-xs text-muted-foreground">Format: XXXXXX/XX/X</p>
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
                        <Input
                            id="address"
                            {...register('address')}
                            placeholder="Full address"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="case_notes">Case Notes</Label>
                        <RichTextEditor
                            value={watch('case_notes')}
                            onChange={(value) => setValue('case_notes', value)}
                            placeholder="Document case history, interventions, progress..."
                        />
                    </div>
                </div>
            )}

            {/* Children Linking */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Link Children in System</h3>
                <p className="text-sm text-muted-foreground">
                    Search and link children who are already registered in the system
                </p>

                <div className="space-y-2">
                    <Label>Search for children</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by child's name..."
                            value={childSearchQuery}
                            onChange={(e) => setChildSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {students && students.length > 0 && childSearchQuery && (
                        <div className="max-h-48 overflow-y-auto border rounded-lg">
                            {students.map((student) => (
                                <button
                                    key={student.id}
                                    type="button"
                                    onClick={() => addChild(student)}
                                    className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                                >
                                    <div className="font-medium">{student.first_name} {student.last_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {student.compound_area || 'No area specified'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {linkedChildren.length > 0 && (
                    <div className="space-y-2">
                        <Label>Linked Children ({linkedChildren.length})</Label>
                        <div className="space-y-2">
                            {linkedChildren.map((child) => (
                                <div
                                    key={child.id}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                                >
                                    <div>
                                        <div className="font-medium">{child.first_name} {child.last_name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {child.compound_area || 'No area specified'}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeChild(child.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Program Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Program Enrollment</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="stage">Stage *</Label>
                        <Select
                            onValueChange={(value) => setValue('stage', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent>
                                {LEGACY_STAGES.map((stage) => (
                                    <SelectItem key={stage} value={stage}>
                                        {stage}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.stage && (
                            <p className="text-sm text-red-600">{errors.stage.message}</p>
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

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            onValueChange={(value) => setValue('status', value)}
                            defaultValue={initialData?.status || 'Active'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Enrollment Notes</Label>
                    <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Add any specific enrollment notes here..."
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={createWoman.isPending || updateWoman.isPending}>
                    {createWoman.isPending || updateWoman.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            {initialData ? <Save className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                            {initialData ? 'Save Changes' : 'Register Participant'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}