import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateVisit, useUpdateVisit } from '@/hooks/useVisits'
import { usePeople } from '@/hooks/usePeople'
import { useCreatePerson } from '@/hooks/usePeople'
import { FacilityDropdown } from '@/components/shared/FacilityDropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, Save } from 'lucide-react'

const visitSchema = z.object({
    patient_id: z.string().min(1, 'Patient is required'),
    visit_date: z.string().min(1, 'Visit date is required'),
    facility_id: z.string().optional().nullable(),
    reason_for_visit: z.string().optional().nullable(),
    diagnosis: z.string().optional().nullable(),
    treatment_provided: z.string().optional().nullable(),
    cost_amount: z.any().optional(),
    medical_fees: z.any().optional(),
    transport_costs: z.any().optional(),
    other_fees: z.any().optional(),
    is_emergency: z.boolean().default(false),
    transport_provided: z.boolean().default(false),
    transport_cost: z.any().optional(),
    follow_up_required: z.boolean().default(false),
    follow_up_date: z.string().optional().nullable(),
    in_hoha_program: z.boolean().default(true),
    notes: z.string().optional().nullable(),
})

export function VisitForm({ initialData, onSuccess, onCancel }) {
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState(() =>
        initialData?.patient ? `${initialData.patient.first_name} ${initialData.patient.last_name}` : ''
    )
    const [showNewPatient, setShowNewPatient] = useState(false)

    const createVisit = useCreateVisit()
    const updateVisit = useUpdateVisit()
    const createPerson = useCreatePerson()
    const { data: people } = usePeople(searchQuery)

    const isEditing = !!initialData

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(visitSchema),
        defaultValues: initialData ? {
            ...initialData,
            visit_date: initialData.visit_date?.split('T')[0],
            follow_up_date: initialData.follow_up_date?.split('T')[0],
            cost_amount: initialData.cost_amount?.toString(),
            medical_fees: initialData.medical_fees?.toString(),
            transport_costs: initialData.transport_costs?.toString(),
            other_fees: initialData.other_fees?.toString(),
            transport_cost: initialData.transport_cost?.toString(),
        } : {
            visit_date: new Date().toISOString().split('T')[0],
            is_emergency: false,
            transport_provided: false,
            follow_up_required: false,
            in_hoha_program: true,
        },
    })

    const watchIsEmergency = useWatch({ control, name: 'is_emergency' })
    const watchTransport = useWatch({ control, name: 'transport_provided' })
    const watchFollowUp = useWatch({ control, name: 'follow_up_required' })
    const watchMedicalFees = useWatch({ control, name: 'medical_fees' })
    const watchTransportCosts = useWatch({ control, name: 'transport_costs' })
    const watchOtherFees = useWatch({ control, name: 'other_fees' })
    const facilityId = useWatch({ control, name: 'facility_id' })

    // Auto-calculate total cost
    useEffect(() => {
        const medical = parseFloat(watchMedicalFees) || 0
        const transport = parseFloat(watchTransportCosts) || 0
        const other = parseFloat(watchOtherFees) || 0
        const total = medical + transport + other

        if (total > 0) {
            setValue('cost_amount', total.toFixed(2))
        }
    }, [watchMedicalFees, watchTransportCosts, watchOtherFees, setValue])

    const onSubmit = async (data) => {
        setError('')
        try {
            // Convert strings to numbers
            const visitData = {
                ...data,
                cost_amount: data.cost_amount ? parseFloat(data.cost_amount) : 0,
                medical_fees: data.medical_fees ? parseFloat(data.medical_fees) : 0,
                transport_costs: data.transport_costs ? parseFloat(data.transport_costs) : 0,
                other_fees: data.other_fees ? parseFloat(data.other_fees) : 0,
                transport_cost: data.transport_cost ? parseFloat(data.transport_cost) : 0,
            }

            if (isEditing) {
                await updateVisit.mutateAsync({ id: initialData.id, updates: visitData })
            } else {
                await createVisit.mutateAsync(visitData)
            }
            onSuccess?.()
        } catch (err) {
            setError(err.message || 'Failed to record visit')
        }
    }

    const handleCreatePatient = async (patientData) => {
        try {
            const newPerson = await createPerson.mutateAsync(patientData)
            setValue('patient_id', newPerson.id)
            setSearchQuery(`${patientData.first_name} ${patientData.last_name}`)
            setShowNewPatient(false)
        } catch (_error) {
            setError('Failed to create patient')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Patient Selection */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Patient Information</h3>

                <div className="space-y-2">
                    <Label>Search Patient</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search by name or phone..."
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
                                        setValue('patient_id', person.id)
                                        setSearchQuery(`${person.first_name} ${person.last_name}`)
                                    }}
                                    className="w-full text-left p-3 hover:bg-neutral-50 transition-colors border-b last:border-b-0"
                                >
                                    <div className="font-medium">{person.first_name} {person.last_name}</div>
                                    <div className="text-sm text-neutral-500">{person.phone_number}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewPatient(!showNewPatient)}
                        className="w-full"
                    >
                        {showNewPatient ? 'Cancel' : '+ New Patient (Community Member)'}
                    </Button>

                    {showNewPatient && (
                        <div className="border rounded-lg p-4 space-y-3 bg-neutral-50">
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="First Name" id="new-first" />
                                <Input placeholder="Last Name" id="new-last" />
                            </div>
                            <Input placeholder="Phone Number" id="new-phone" />
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    const first = document.getElementById('new-first').value
                                    const last = document.getElementById('new-last').value
                                    const phone = document.getElementById('new-phone').value
                                    if (first && last) {
                                        handleCreatePatient({ first_name: first, last_name: last, phone_number: phone })
                                    }
                                }}
                            >
                                Create Patient
                            </Button>
                        </div>
                    )}

                    {errors.patient_id && (
                        <p className="text-sm text-red-600">{errors.patient_id.message}</p>
                    )}
                </div>
            </div>

            {/* Visit Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Visit Details</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="visit_date">Visit Date *</Label>
                        <Input
                            id="visit_date"
                            type="date"
                            {...register('visit_date')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="facility_id">Facility/Hospital</Label>
                        <FacilityDropdown
                            value={facilityId}
                            onChange={(value) => setValue('facility_id', value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reason_for_visit">Reason for Visit</Label>
                    <Textarea
                        id="reason_for_visit"
                        {...register('reason_for_visit')}
                        placeholder="Symptoms, complaints..."
                        rows={2}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea
                        id="diagnosis"
                        {...register('diagnosis')}
                        placeholder="Medical diagnosis"
                        rows={2}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="treatment_provided">Treatment Provided</Label>
                    <Textarea
                        id="treatment_provided"
                        {...register('treatment_provided')}
                        placeholder="Medications, procedures..."
                        rows={2}
                    />
                </div>
            </div>

            {/* Cost Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cost Information</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="medical_fees">Medical Fees (ZMW)</Label>
                        <Input
                            id="medical_fees"
                            type="number"
                            step="0.01"
                            {...register('medical_fees')}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transport_costs">Transport Costs (ZMW)</Label>
                        <Input
                            id="transport_costs"
                            type="number"
                            step="0.01"
                            {...register('transport_costs')}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="other_fees">Other Fees (ZMW)</Label>
                        <Input
                            id="other_fees"
                            type="number"
                            step="0.01"
                            {...register('other_fees')}
                            placeholder="0.00"
                        />
                        <p className="text-xs text-muted-foreground">Lab tests, X-rays, etc.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cost_amount">Total Cost (ZMW)</Label>
                        <Input
                            id="cost_amount"
                            type="number"
                            step="0.01"
                            {...register('cost_amount')}
                            placeholder="0.00"
                            className="font-semibold"
                        />
                        <p className="text-xs text-muted-foreground">Auto-calculated from above fees</p>
                    </div>
                </div>
            </div>

            {/* Flags */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>

                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_emergency"
                            checked={watchIsEmergency}
                            onCheckedChange={(checked) => setValue('is_emergency', checked)}
                        />
                        <Label htmlFor="is_emergency" className="cursor-pointer">
                            Emergency Visit
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="transport_provided"
                            checked={watchTransport}
                            onCheckedChange={(checked) => setValue('transport_provided', checked)}
                        />
                        <Label htmlFor="transport_provided" className="cursor-pointer">
                            Transport Provided
                        </Label>
                    </div>

                    {watchTransport && (
                        <div className="ml-6 space-y-2">
                            <Label htmlFor="transport_cost">Transport Cost (ZMW)</Label>
                            <Input
                                id="transport_cost"
                                type="number"
                                step="0.01"
                                {...register('transport_cost')}
                                placeholder="0.00"
                            />
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="follow_up_required"
                            checked={watchFollowUp}
                            onCheckedChange={(checked) => setValue('follow_up_required', checked)}
                        />
                        <Label htmlFor="follow_up_required" className="cursor-pointer">
                            Follow-up Required
                        </Label>
                    </div>

                    {watchFollowUp && (
                        <div className="ml-6 space-y-2">
                            <Label htmlFor="follow_up_date">Follow-up Date</Label>
                            <Input
                                id="follow_up_date"
                                type="date"
                                {...register('follow_up_date')}
                            />
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="in_hoha_program"
                            defaultChecked
                            onCheckedChange={(checked) => setValue('in_hoha_program', checked)}
                        />
                        <Label htmlFor="in_hoha_program" className="cursor-pointer">
                            HOHA Program Member
                        </Label>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Any additional information..."
                        rows={3}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={createVisit.isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={createVisit.isPending || updateVisit.isPending}>
                    {(createVisit.isPending || updateVisit.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Save Changes' : 'Record Visit'}
                </Button>
            </div>
        </form>
    )
}
