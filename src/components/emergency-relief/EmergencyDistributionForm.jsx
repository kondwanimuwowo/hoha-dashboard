import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateEmergencyDistribution } from '@/hooks/useEmergencyRelief'
import { usePeople } from '@/hooks/usePeople'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, X } from 'lucide-react'

const distributionSchema = z.object({
    distribution_date: z.string().min(1, 'Distribution date is required'),
    reason: z.string().min(1, 'Reason is required'),
    notes: z.string().optional(),
})

export function EmergencyDistributionForm({ onSuccess, onCancel }) {
    const [error, setError] = useState('')
    const [recipients, setRecipients] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    const createDistribution = useCreateEmergencyDistribution()
    const { data: people } = usePeople(searchQuery)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(distributionSchema),
        defaultValues: {
            distribution_date: new Date().toISOString().split('T')[0],
        },
    })

    const addRecipient = (person) => {
        if (!recipients.find(r => r.id === person.id)) {
            setRecipients([...recipients, {
                ...person,
                items_provided: '',
            }])
        }
        setSearchQuery('')
    }

    const removeRecipient = (personId) => {
        setRecipients(recipients.filter(r => r.id !== personId))
    }

    const updateRecipientItems = (personId, items) => {
        setRecipients(recipients.map(r =>
            r.id === personId ? { ...r, items_provided: items } : r
        ))
    }

    const onSubmit = async (data) => {
        setError('')

        if (recipients.length === 0) {
            setError('Please add at least one recipient family')
            return
        }

        try {
            await createDistribution.mutateAsync({
                ...data,
                recipients: recipients.map(r => ({
                    family_head_id: r.id,
                    items_provided: r.items_provided,
                })),
            })
            onSuccess?.()
        } catch (err) {
            setError(err.message || 'Failed to create distribution')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Distribution Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Distribution Details</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="distribution_date">Distribution Date *</Label>
                        <Input
                            id="distribution_date"
                            type="date"
                            {...register('distribution_date')}
                        />
                        {errors.distribution_date && (
                            <p className="text-sm text-red-600">{errors.distribution_date.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason/Crisis *</Label>
                        <Input
                            id="reason"
                            {...register('reason')}
                            placeholder="e.g., Flood relief, Fire victims"
                        />
                        {errors.reason && (
                            <p className="text-sm text-red-600">{errors.reason.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Additional information about this distribution..."
                        rows={2}
                    />
                </div>
            </div>

            {/* Recipients */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recipients</h3>

                <div className="space-y-2">
                    <Label>Search for family head</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {people && people.length > 0 && searchQuery && (
                        <div className="max-h-48 overflow-y-auto border rounded-lg">
                            {people.map((person) => (
                                <button
                                    key={person.id}
                                    type="button"
                                    onClick={() => addRecipient(person)}
                                    className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                                >
                                    <div className="font-medium">{person.first_name} {person.last_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {person.compound_area || 'No area specified'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {recipients.length > 0 && (
                    <div className="space-y-2">
                        <Label>Selected Recipients ({recipients.length})</Label>
                        <div className="space-y-3">
                            {recipients.map((recipient) => (
                                <div
                                    key={recipient.id}
                                    className="border rounded-lg p-3 space-y-2"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-medium">
                                                {recipient.first_name} {recipient.last_name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {recipient.compound_area || 'No area specified'}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeRecipient(recipient.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Items Provided</Label>
                                        <Input
                                            placeholder="e.g., 10kg mealie meal, 2L cooking oil, beans"
                                            value={recipient.items_provided}
                                            onChange={(e) => updateRecipientItems(recipient.id, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={createDistribution.isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={createDistribution.isPending}>
                    {createDistribution.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Distribution
                </Button>
            </div>
        </form>
    )
}
