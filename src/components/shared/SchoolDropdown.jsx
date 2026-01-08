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
import { useSchools, useCreateSchool } from '@/hooks/useSchools'

export function SchoolDropdown({ value, onChange, className }) {
    const [open, setOpen] = useState(false)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [newSchool, setNewSchool] = useState({
        school_name: '',
        location: '',
        contact_person: '',
        contact_phone: '',
    })

    const { data: schools, isLoading } = useSchools()
    const createSchool = useCreateSchool()

    const selectedSchool = schools?.find(s => s.id === value)

    const handleAddSchool = async () => {
        if (!newSchool.school_name.trim()) return

        try {
            await createSchool.mutateAsync(newSchool)
            setShowAddDialog(false)
            setNewSchool({
                school_name: '',
                location: '',
                contact_person: '',
                contact_phone: '',
            })
        } catch (error) {
            console.error('Failed to create school:', error)
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
                        {selectedSchool?.school_name || 'Select school...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">No school found</p>
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
                                        Add New School
                                    </Button>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {schools?.map((school) => (
                                    <CommandItem
                                        key={school.id}
                                        value={school.school_name}
                                        onSelect={() => {
                                            onChange(school.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === school.id ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        {school.school_name}
                                        {school.location && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({school.location})
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
                                    Add New School
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Government School</DialogTitle>
                        <div hidden>
                            <DialogDescription>
                                Enter details for the new government school
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="school_name">School Name *</Label>
                            <Input
                                id="school_name"
                                value={newSchool.school_name}
                                onChange={(e) => setNewSchool({ ...newSchool, school_name: e.target.value })}
                                placeholder="e.g., Kanyama Primary School"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={newSchool.location}
                                onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })}
                                placeholder="e.g., Kanyama Compound"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_person">Contact Person</Label>
                            <Input
                                id="contact_person"
                                value={newSchool.contact_person}
                                onChange={(e) => setNewSchool({ ...newSchool, contact_person: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">Contact Phone</Label>
                            <Input
                                id="contact_phone"
                                value={newSchool.contact_phone}
                                onChange={(e) => setNewSchool({ ...newSchool, contact_phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddSchool} disabled={createSchool.isPending}>
                            {createSchool.isPending ? 'Adding...' : 'Add School'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
