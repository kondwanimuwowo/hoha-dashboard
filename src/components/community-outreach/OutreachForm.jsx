import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateOutreach, useOutreachLocations, useAddLocation } from '@/hooks/useOutreach'
import { usePeople } from '@/hooks/usePeople'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Search, Plus, X, UserPlus } from 'lucide-react'

const outreachSchema = z.object({
    outreach_date: z.string().min(1, 'Date is required'),
    location_id: z.string().optional(),
    location_name: z.string().optional(),
    notes: z.string().optional(),
})

const EXPENSE_TYPES = ['Medical Bills', 'Rent', 'School Fees', 'Food', 'Other']

export function OutreachForm({ onSuccess, onCancel }) {
    const [error, setError] = useState('')
    const [participants, setParticipants] = useState([])
    const [expenses, setExpenses] = useState([])
    const [useExistingPerson, setUseExistingPerson] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddLocation, setShowAddLocation] = useState(false)
    const [newLocationName, setNewLocationName] = useState('')

    const createOutreach = useCreateOutreach()
    const { data: locations } = useOutreachLocations()
    const { data: people } = usePeople(searchQuery)
    const addLocation = useAddLocation()

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(outreachSchema),
        defaultValues: {
            outreach_date: new Date().toISOString().split('T')[0],
        },
    })

    const selectedLocationId = watch('location_id')

    // Add participant
    const handleAddParticipant = (person = null, adHocName = null, isRegistered = false) => {
        const newParticipant = {
            id: Date.now(),
            person_id: person?.id || null,
            person_name: person ? `${person.first_name} ${person.last_name}` : null,
            ad_hoc_name: adHocName,
            is_registered_member: person ? person.is_registered_member : isRegistered,
            notes: '',
        }
        setParticipants([...participants, newParticipant])
        setSearchQuery('')
    }

    // Remove participant
    const handleRemoveParticipant = (id) => {
        setParticipants(participants.filter(p => p.id !== id))
        // Remove associated expenses
        setExpenses(expenses.filter(e => e.participant_id !== id))
    }

    // Add expense
    const handleAddExpense = () => {
        setExpenses([...expenses, {
            id: Date.now(),
            participant_id: null,
            expense_type: 'Medical Bills',
            amount: 0,
            description: '',
        }])
    }

    // Update expense
    const handleUpdateExpense = (id, field, value) => {
        setExpenses(expenses.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ))
    }

    // Remove expense
    const handleRemoveExpense = (id) => {
        setExpenses(expenses.filter(e => e.id !== id))
    }

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
    const expensesByType = EXPENSE_TYPES.reduce((acc, type) => {
        acc[type] = expenses
            .filter(e => e.expense_type === type)
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
        return acc
    }, {})

    // Handle location addition
    const handleAddNewLocation = async () => {
        if (!newLocationName.trim()) return

        try {
            const newLoc = await addLocation.mutateAsync(newLocationName.trim())
            setValue('location_id', newLoc.id)
            setShowAddLocation(false)
            setNewLocationName('')
        } catch (err) {
            setError('Failed to add location')
        }
    }

    const onSubmit = async (data) => {
        setError('')

        if (participants.length === 0) {
            setError('Please add at least one participant')
            return
        }

        try {
            await createOutreach.mutateAsync({
                event: data,
                participants: participants.map(p => ({
                    person_id: p.person_id,
                    ad_hoc_name: p.ad_hoc_name,
                    is_registered_member: p.is_registered_member,
                    notes: p.notes,
                })),
                expenses: expenses.map(e => ({
                    participant_id: participants.find(p => p.id === e.participant_id)?.person_id || null,
                    expense_type: e.expense_type,
                    amount: parseFloat(e.amount),
                    description: e.description,
                })),
            })
            onSuccess?.()
        } catch (err) {
            setError(err.message || 'Failed to record outreach')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Details</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="outreach_date">Date *</Label>
                        <Input
                            id="outreach_date"
                            type="date"
                            {...register('outreach_date')}
                        />
                        {errors.outreach_date && (
                            <p className="text-sm text-red-600">{errors.outreach_date.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location_id">Location Type</Label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedLocationId}
                                onValueChange={(value) => setValue('location_id', value)}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select location type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations?.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setShowAddLocation(!showAddLocation)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {showAddLocation && (
                            <div className="flex gap-2 mt-2">
                                <Input
                                    placeholder="New location name"
                                    value={newLocationName}
                                    onChange={(e) => setNewLocationName(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAddNewLocation}
                                    disabled={addLocation.isPending}
                                >
                                    Add
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location_name">Specific Location / Address</Label>
                    <Input
                        id="location_name"
                        {...register('location_name')}
                        placeholder="e.g., Kanyama Clinic, Chawama Basic School"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="General notes about this outreach event..."
                        rows={3}
                    />
                </div>
            </div>

            {/* Participants Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">People Helped</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Toggle between existing and ad-hoc */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="use-existing"
                            checked={useExistingPerson}
                            onCheckedChange={setUseExistingPerson}
                        />
                        <Label htmlFor="use-existing" className="cursor-pointer">
                            Select from existing people
                        </Label>
                    </div>

                    {useExistingPerson ? (
                        <div className="space-y-2">
                            <Label>Search Person</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or phone..."
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
                                            onClick={() => handleAddParticipant(person)}
                                            className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {person.first_name} {person.last_name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {person.phone_number}
                                                </div>
                                            </div>
                                            <Badge variant={person.is_registered_member ? 'default' : 'secondary'}>
                                                {person.is_registered_member ? 'Registered' : 'Non-Registered'}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    id="ad-hoc-name"
                                    placeholder="Enter person's name"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="ad-hoc-registered" />
                                <Label htmlFor="ad-hoc-registered" className="cursor-pointer">
                                    HOHA Registered Member
                                </Label>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    const name = document.getElementById('ad-hoc-name').value
                                    const isRegistered = document.getElementById('ad-hoc-registered').checked
                                    if (name.trim()) {
                                        handleAddParticipant(null, name.trim(), isRegistered)
                                        document.getElementById('ad-hoc-name').value = ''
                                        document.getElementById('ad-hoc-registered').checked = false
                                    }
                                }}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Person
                            </Button>
                        </div>
                    )}

                    {/* Participants List */}
                    {participants.length > 0 && (
                        <div className="space-y-2 mt-4">
                            <Label>Added Participants ({participants.length})</Label>
                            <div className="space-y-2">
                                {participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {participant.person_name || participant.ad_hoc_name}
                                            </div>
                                            <Badge variant={participant.is_registered_member ? 'default' : 'secondary'} className="mt-1">
                                                {participant.is_registered_member ? 'Registered' : 'Non-Registered'}
                                            </Badge>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveParticipant(participant.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expenses Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Financial Support</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddExpense}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {expenses.length > 0 ? (
                        <div className="space-y-3">
                            {expenses.map((expense) => (
                                <div key={expense.id} className="grid grid-cols-12 gap-3 items-start p-3 border rounded-lg">
                                    <div className="col-span-3">
                                        <Label className="text-xs">Type</Label>
                                        <Select
                                            value={expense.expense_type}
                                            onValueChange={(value) => handleUpdateExpense(expense.id, 'expense_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EXPENSE_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs">Amount (ZMW)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={expense.amount}
                                            onChange={(e) => handleUpdateExpense(expense.id, 'amount', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-6">
                                        <Label className="text-xs">Description</Label>
                                        <Input
                                            value={expense.description}
                                            onChange={(e) => handleUpdateExpense(expense.id, 'description', e.target.value)}
                                            placeholder="Details..."
                                        />
                                    </div>
                                    <div className="col-span-1 flex items-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveExpense(expense.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">
                            No expenses added yet
                        </p>
                    )}

                    {/* Summary */}
                    {expenses.length > 0 && (
                        <div className="border-t pt-4 space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                                {EXPENSE_TYPES.map((type) => (
                                    expensesByType[type] > 0 && (
                                        <div key={type} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{type}:</span>
                                            <span className="font-medium">K{expensesByType[type].toFixed(2)}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                                <span>Total:</span>
                                <span>K{totalExpenses.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-muted/50">
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold">{participants.length}</div>
                            <div className="text-sm text-muted-foreground">People Helped</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{expenses.length}</div>
                            <div className="text-sm text-muted-foreground">Expense Items</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">K{totalExpenses.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">Total Expenses</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={createOutreach.isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={createOutreach.isPending}>
                    {createOutreach.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Record Outreach
                </Button>
            </div>
        </form>
    )
}
