import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandList,
    CommandItem,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFacilities, useCreateFacility } from '@/hooks/useFacilities'

export function FacilityDropdown({ value, onChange, className }) {
    const [open, setOpen] = useState(false)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [newFacility, setNewFacility] = useState({
        facility_name: '',
        location: '',
        contact_person: '',
        contact_phone: '',
    })

    const { data: facilities, isLoading } = useFacilities()
    const createFacility = useCreateFacility()

    const selectedFacility = facilities?.find(f => f.id === value)

    const handleAddFacility = async () => {
        if (!newFacility.facility_name.trim()) return

        try {
            await createFacility.mutateAsync(newFacility)
            setShowAddDialog(false)
            setNewFacility({
                facility_name: '',
                location: '',
                contact_person: '',
                contact_phone: '',
            })
        } catch (error) {
            console.error('Failed to create facility:', error)
        }
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn('w-full justify-between', className)}
                    >
                        {selectedFacility?.facility_name || 'Select facility...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">No facility found</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setOpen(false)
                                            setShowAddDialog(true)
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add New Facility
                                    </Button>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {facilities?.map((facility) => (
                                    <CommandItem
                                        key={facility.id}
                                        value={facility.facility_name}
                                        onSelect={() => {
                                            onChange(facility.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === facility.id ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        {facility.facility_name}
                                        {facility.location && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({facility.location})
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                                <CommandItem
                                    onSelect={() => {
                                        setOpen(false)
                                        setShowAddDialog(true)
                                    }}
                                    className="border-t"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New Facility
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Medical Facility</DialogTitle>
                        <div hidden>
                            <DialogDescription>
                                Enter details for the new medical facility
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="facility_name">Facility Name *</Label>
                            <Input
                                id="facility_name"
                                value={newFacility.facility_name}
                                onChange={(e) => setNewFacility({ ...newFacility, facility_name: e.target.value })}
                                placeholder="e.g., Kanyama Clinic"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={newFacility.location}
                                onChange={(e) => setNewFacility({ ...newFacility, location: e.target.value })}
                                placeholder="e.g., Kanyama Compound"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_person">Contact Person</Label>
                            <Input
                                id="contact_person"
                                value={newFacility.contact_person}
                                onChange={(e) => setNewFacility({ ...newFacility, contact_person: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">Contact Phone</Label>
                            <Input
                                id="contact_phone"
                                value={newFacility.contact_phone}
                                onChange={(e) => setNewFacility({ ...newFacility, contact_phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddFacility} disabled={createFacility.isPending}>
                            {createFacility.isPending ? 'Adding...' : 'Add Facility'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
