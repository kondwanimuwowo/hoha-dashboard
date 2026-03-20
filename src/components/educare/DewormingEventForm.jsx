import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'

const schema = z.object({
    event_date: z.string().min(1, 'Date is required'),
    medication_name: z.string().min(1, 'Medication name is required'),
    dosage_amount: z.coerce.number().positive('Dosage must be positive'),
    dosage_unit: z.string().min(1),
    notes: z.string().optional(),
})

export function DewormingEventForm({ open, onOpenChange, onSubmit, isSubmitting }) {
    const today = new Date().toISOString().split('T')[0]

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            event_date: today,
            medication_name: '',
            dosage_amount: '',
            dosage_unit: 'mg',
            notes: '',
        },
    })

    const dosageUnit = watch('dosage_unit')

    const handleFormSubmit = async (data) => {
        await onSubmit(data)
        reset()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Deworming Event</DialogTitle>
                    <div hidden>
                        <DialogDescription>
                            Create a new deworming event for all active students
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="event_date">Event Date</Label>
                        <Input
                            id="event_date"
                            type="date"
                            max={today}
                            {...register('event_date')}
                        />
                        {errors.event_date && (
                            <p className="text-sm text-red-600">{errors.event_date.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="medication_name">Medication Name</Label>
                        <Input
                            id="medication_name"
                            placeholder="e.g. Albendazole"
                            {...register('medication_name')}
                        />
                        {errors.medication_name && (
                            <p className="text-sm text-red-600">{errors.medication_name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="dosage_amount">Dosage Amount</Label>
                            <Input
                                id="dosage_amount"
                                type="number"
                                step="0.01"
                                placeholder="e.g. 400"
                                {...register('dosage_amount')}
                            />
                            {errors.dosage_amount && (
                                <p className="text-sm text-red-600">{errors.dosage_amount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dosage_unit">Unit</Label>
                            <Select
                                value={dosageUnit}
                                onValueChange={(val) => setValue('dosage_unit', val)}
                            >
                                <SelectTrigger id="dosage_unit">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mg">mg</SelectItem>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="tablet">tablet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional notes..."
                            {...register('notes')}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Event'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
