import { useState } from 'react'
import { toast } from 'sonner'
import { Search, UserCheck, UserPlus } from 'lucide-react'
import { useAddEmergencyRecipient } from '@/hooks/useEmergencyRelief'
import { usePeople } from '@/hooks/usePeople'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function AddRecipientForm({ distributionId, existingPersonIds, onDone }) {
    const [mode, setMode] = useState('registered')
    const [search, setSearch] = useState('')
    const [adHocName, setAdHocName] = useState('')
    const [items, setItems] = useState('')
    const [selectedPerson, setSelectedPerson] = useState(null)
    const [error, setError] = useState('')

    const addRecipient = useAddEmergencyRecipient()
    const { data: people } = usePeople(search)

    const switchMode = (next) => {
        setMode(next)
        setSearch('')
        setSelectedPerson(null)
        setAdHocName('')
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const name = adHocName.trim()
        if (mode === 'registered' && !selectedPerson) {
            setError('Please search for and select a registered member.')
            return
        }
        if (mode === 'non-registered' && name.length < 2) {
            setError('Please enter a name of at least 2 characters.')
            return
        }

        try {
            await addRecipient.mutateAsync({
                distribution_id: distributionId,
                family_head_id: mode === 'registered' ? selectedPerson.id : null,
                ad_hoc_name: mode === 'non-registered' ? name : null,
                items_provided: items.trim(),
            })
            toast.success('Recipient added')
            onDone()
        } catch (err) {
            toast.error('Failed to add recipient: ' + err.message)
        }
    }

    const results = (people || []).filter((p) => !existingPersonIds.includes(p.id))

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
                <Button type="button" size="sm" variant={mode === 'registered' ? 'default' : 'outline'} onClick={() => switchMode('registered')}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    HOHA Registered
                </Button>
                <Button type="button" size="sm" variant={mode === 'non-registered' ? 'default' : 'outline'} onClick={() => switchMode('non-registered')}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Non-Registered
                </Button>
            </div>

            {mode === 'registered' ? (
                <div className="space-y-2">
                    {selectedPerson ? (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <span className="font-medium">{selectedPerson.first_name} {selectedPerson.last_name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPerson(null)}>
                                Change
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search registered member by name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            {search && results.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-lg border">
                                    {results.map((person) => (
                                        <button
                                            key={person.id}
                                            type="button"
                                            onClick={() => setSelectedPerson(person)}
                                            className="w-full border-b p-3 text-left transition-colors last:border-b-0 hover:bg-muted"
                                        >
                                            <div className="font-medium">{person.first_name} {person.last_name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {person.compound_area || 'No area specified'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    <Input
                        placeholder="Full name of recipient..."
                        value={adHocName}
                        onChange={(e) => setAdHocName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Name only. No record will be created in the system.</p>
                </div>
            )}

            <div className="space-y-2">
                <Label>Items Provided</Label>
                <Input
                    placeholder="e.g., 10kg mealie meal, 2L cooking oil"
                    value={items}
                    onChange={(e) => setItems(e.target.value)}
                />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onDone} disabled={addRecipient.isPending}>
                    Cancel
                </Button>
                <Button type="submit" disabled={addRecipient.isPending}>
                    {addRecipient.isPending ? 'Adding...' : 'Add Recipient'}
                </Button>
            </div>
        </form>
    )
}

export function AddEmergencyRecipientDialog({ open, onOpenChange, distributionId, existingPersonIds = [] }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Recipient</DialogTitle>
                    <DialogDescription>Add another family to this distribution.</DialogDescription>
                </DialogHeader>
                <AddRecipientForm
                    distributionId={distributionId}
                    existingPersonIds={existingPersonIds}
                    onDone={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
