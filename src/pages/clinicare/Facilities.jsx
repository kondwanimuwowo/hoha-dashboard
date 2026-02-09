import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

import { useFacilities, useCreateFacility, useUpdateFacility, useDeleteFacility } from '@/hooks/useFacilities'
import { Plus, Search, Pencil, Trash2, Building2, MapPin, Phone, User, Loader2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function Facilities() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFacility, setSelectedFacility] = useState(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [facilityToDelete, setFacilityToDelete] = useState(null)

    const { data: facilities, isLoading } = useFacilities()
    const deleteFacility = useDeleteFacility()

    const filteredFacilities = facilities?.filter(f =>
        f.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.location?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleDeleteClick = (facility) => {
        setFacilityToDelete(facility)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (facilityToDelete) {
            await deleteFacility.mutateAsync(facilityToDelete.id)
            setIsDeleteDialogOpen(false)
            setFacilityToDelete(null)
        }
    }

    const handleEditClick = (facility) => {
        setSelectedFacility(facility)
        setIsDialogOpen(true)
    }

    const handleAddClick = () => {
        setSelectedFacility(null)
        setIsDialogOpen(true)
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Medical Facilities"
                    description="Manage hospitals and clinics for patient referrals"
                />
                <Button onClick={handleAddClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Facility
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search facilities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Facility Name</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Contact Person</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFacilities?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No facilities found. Add one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFacilities?.map((facility) => (
                                        <TableRow key={facility.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <Building2 className="h-4 w-4" />
                                                    </div>
                                                    <span>{facility.facility_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {facility.location && (
                                                    <div className="flex items-center text-neutral-600 text-sm">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        {facility.location}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {facility.contact_person && (
                                                        <div className="flex items-center text-sm">
                                                            <User className="h-3 w-3 mr-1 text-neutral-400" />
                                                            {facility.contact_person}
                                                        </div>
                                                    )}
                                                    {facility.contact_phone && (
                                                        <div className="flex items-center text-sm text-neutral-500">
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            {facility.contact_phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditClick(facility)}
                                                    >
                                                        <Pencil className="h-4 w-4 text-neutral-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(facility)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <FacilityDialog
                key={`${selectedFacility?.id || 'new'}-${isDialogOpen ? 'open' : 'closed'}`}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                facility={selectedFacility}
            />

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This will remove <strong>{facilityToDelete?.facility_name}</strong> from the active list.
                            Historical visits linked to this facility will remain unchanged.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function FacilityDialog({ open, onOpenChange, facility }) {
    const [formData, setFormData] = useState(() => ({
        facility_name: facility?.facility_name || '',
        location: facility?.location || '',
        contact_person: facility?.contact_person || '',
        contact_phone: facility?.contact_phone || '',
    }))

    const createFacility = useCreateFacility()
    const updateFacility = useUpdateFacility()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (facility) {
                await updateFacility.mutateAsync({
                    id: facility.id,
                    updates: formData
                })
            } else {
                await createFacility.mutateAsync(formData)
            }
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        }
    }

    const isSubmitting = createFacility.isPending || updateFacility.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{facility ? 'Edit Facility' : 'Add New Facility'}</DialogTitle>
                    <DialogDescription>
                        {facility ? 'Update facility details below.' : 'Enter details for the new medical facility.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="facility_name">Facility Name *</Label>
                            <Input
                                id="facility_name"
                                value={formData.facility_name}
                                onChange={(e) => setFormData({ ...formData, facility_name: e.target.value })}
                                placeholder="e.g., Kanyama Clinic"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Kanyama Compound"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_person">Contact Person</Label>
                            <Input
                                id="contact_person"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">Contact Phone</Label>
                            <Input
                                id="contact_phone"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {facility ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                <>{facility ? 'Update Facility' : 'Add Facility'}</>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
