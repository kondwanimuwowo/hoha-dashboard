import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { usePeople, useCreatePerson, useFamilyGroups } from '@/hooks/usePeople'
import { useAddRecipient } from '@/hooks/useFoodDistribution'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, Users as UsersIcon, CheckCircle, Loader2, Home } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function AddRecipientDialog({ open, onOpenChange, distributionId }) {
    const [activeTab, setActiveTab] = useState('families')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPerson, setSelectedPerson] = useState(null)
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [familySize, setFamilySize] = useState('')
    const [specialNeeds, setSpecialNeeds] = useState('')
    const [familyInfo, setFamilyInfo] = useState(null)

    const { data: people } = usePeople()
    const { data: familyGroups } = useFamilyGroups()
    const addRecipient = useAddRecipient()

    const filteredPeople = people?.filter((person) => {
        const fullName = `${person.first_name} ${person.last_name}`.toLowerCase()
        const phone = person.phone_number || ''
        return fullName.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery)
    })

    const filteredFamilies = familyGroups?.filter((family) => {
        const name = family.recipient_name?.toLowerCase() || ''
        return name.includes(searchQuery.toLowerCase())
    })

    useEffect(() => {
        if (!selectedPerson) {
            if (!selectedGroup) setFamilyInfo(null)
            return
        }

        async function checkFamily() {
            // Check if Head
            const { data: headData } = await supabase
                .from('family_groups')
                .select('id, recipient_name')
                .eq('recipient_id', selectedPerson.id)
                .maybeSingle()

            if (headData) {
                setFamilyInfo({
                    id: headData.id,
                    role: 'Head',
                    name: headData.recipient_name
                })
                return
            }

            // Check if Member (in family_member_ids array)
            const { data: memberData } = await supabase
                .from('family_groups')
                .select('recipient_id, recipient_name, family_member_ids')
                .contains('family_member_ids', [selectedPerson.id])
                .maybeSingle()

            if (memberData) {
                setFamilyInfo({
                    id: memberData.recipient_id,
                    role: 'Member',
                    name: memberData.recipient_name
                })
                return
            }

            setFamilyInfo(null)
        }
        checkFamily()
    }, [selectedPerson])

    const handleAddExisting = async (e) => {
        e.preventDefault()
        if (!selectedPerson && !selectedGroup) return

        try {
            const headId = selectedGroup ? selectedGroup.recipient_id : selectedPerson.id
            const groupId = selectedGroup ? selectedGroup.recipient_id : (familyInfo?.id || null)

            await addRecipient.mutateAsync({
                distribution_id: distributionId,
                family_head_id: headId,
                family_group_id: groupId,
                family_size: parseInt(familySize) || 1,
                special_needs: specialNeeds || null,
            })
            onOpenChange(false)
            resetForm()
        } catch (err) {
            console.error('Failed to add recipient:', err)
            alert(err.message)
        }
    }

    const resetForm = () => {
        setSelectedPerson(null)
        setSelectedGroup(null)
        setFamilySize('')
        setSpecialNeeds('')
        setSearchQuery('')
        setActiveTab('families')
        setFamilyInfo(null)
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            onOpenChange(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Recipient</DialogTitle>
                    <DialogDescription>
                        Select a family group, an individual, or register a new person.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="families">Family Groups</TabsTrigger>
                        <TabsTrigger value="existing">Individual</TabsTrigger>
                        <TabsTrigger value="new">New Person</TabsTrigger>
                    </TabsList>

                    <TabsContent value="families" className="space-y-4 pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search by family head..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <div className="border rounded-lg max-h-64 overflow-y-auto">
                            {filteredFamilies && filteredFamilies.length > 0 ? (
                                <div className="divide-y">
                                    {filteredFamilies.map((family) => (
                                        <motion.div
                                            key={family.id}
                                            whileHover={{ backgroundColor: 'rgb(250, 250, 250)' }}
                                            className={`p-3 cursor-pointer transition-colors ${selectedGroup?.id === family.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                                                }`}
                                            onClick={() => {
                                                setSelectedGroup(family)
                                                setSelectedPerson(null)
                                                setFamilySize(family.family_size.toString())
                                            }}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Home className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-neutral-900">
                                                        {family.recipient_name}
                                                    </div>
                                                    <div className="text-sm text-neutral-600">
                                                        {family.compound_area || 'No area'} • {family.family_size} Members
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-neutral-500">
                                    No family groups found
                                </div>
                            )}
                        </div>

                        {selectedGroup && (
                            <form onSubmit={handleAddExisting} className="space-y-4 pt-4 border-t">
                                <div className="bg-primary/5 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <div className="text-xs text-primary-700 font-semibold uppercase tracking-wider">Selected Family</div>
                                        <div className="font-semibold text-neutral-900">
                                            {selectedGroup.recipient_name}
                                        </div>
                                    </div>
                                    <Badge variant="outline">{selectedGroup.family_size} Persons</Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="famSize">Family Size *</Label>
                                        <Input
                                            id="famSize"
                                            type="number"
                                            value={familySize}
                                            onChange={(e) => setFamilySize(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="needs">Special Needs</Label>
                                        <Input
                                            id="needs"
                                            value={specialNeeds}
                                            onChange={(e) => setSpecialNeeds(e.target.value)}
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={addRecipient.isPending}>
                                    {addRecipient.isPending ? 'Adding...' : 'Confirm Family Collection'}
                                </Button>
                            </form>
                        )}
                    </TabsContent>

                    <TabsContent value="existing" className="space-y-4">
                        {/* Search */}
                        <div className="relative pt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search by name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* People List */}
                        <div className="border rounded-lg max-h-64 overflow-y-auto">
                            {filteredPeople && filteredPeople.length > 0 ? (
                                <div className="divide-y">
                                    {filteredPeople.map((person) => (
                                        <motion.div
                                            key={person.id}
                                            whileHover={{ backgroundColor: 'rgb(250, 250, 250)' }}
                                            className={`p-3 cursor-pointer transition-colors ${selectedPerson?.id === person.id ? 'bg-green-50 border-l-4 border-green-600' : ''
                                                }`}
                                            onClick={() => setSelectedPerson(person)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <PersonAvatar
                                                    photoUrl={person.photo_url}
                                                    gender={person.gender}
                                                    firstName={person.first_name}
                                                    lastName={person.last_name}
                                                    className="h-10 w-10"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-semibold text-neutral-900">
                                                        {person.first_name} {person.last_name}
                                                    </div>
                                                    <div className="text-sm text-neutral-600">
                                                        {person.phone_number || 'No phone'}
                                                        {person.compound_area && ` • ${person.compound_area}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-neutral-500">
                                    {searchQuery ? 'No people found' : 'Start typing to search'}
                                </div>
                            )}
                        </div>

                        {selectedPerson && (
                            <form onSubmit={handleAddExisting} className="space-y-4 pt-4 border-t">
                                <div className="bg-green-50 p-3 rounded-lg space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-sm text-neutral-600">Selected Person</div>
                                            <div className="font-semibold text-neutral-900">
                                                {selectedPerson.first_name} {selectedPerson.last_name}
                                            </div>
                                        </div>
                                        {familyInfo ? (
                                            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center">
                                                <UsersIcon className="w-3 h-3 mr-1" />
                                                Family {familyInfo.role}
                                            </div>
                                        ) : (
                                            <div className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs font-medium">
                                                Individual
                                            </div>
                                        )}
                                    </div>

                                    {familyInfo && (
                                        <div className="text-sm text-blue-800 bg-blue-50 p-2 rounded border border-blue-100">
                                            Linked to Family Group: <strong>{familyInfo.name}'s Family</strong>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="familySize">Family Size *</Label>
                                    <Input
                                        id="familySize"
                                        type="number"
                                        min="1"
                                        value={familySize}
                                        onChange={(e) => setFamilySize(e.target.value)}
                                        placeholder="e.g., 5"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="specialNeeds">Special Needs (Optional)</Label>
                                    <Textarea
                                        id="specialNeeds"
                                        value={specialNeeds}
                                        onChange={(e) => setSpecialNeeds(e.target.value)}
                                        placeholder="Any dietary restrictions, allergies, or special requirements..."
                                        rows={3}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={addRecipient.isPending}>
                                        {addRecipient.isPending ? 'Adding...' : 'Add Recipient'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </TabsContent>

                    <TabsContent value="new" className="space-y-4">
                        <NewPersonForm
                            distributionId={distributionId}
                            onSuccess={() => {
                                onOpenChange(false)
                                resetForm()
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

function NewPersonForm({ distributionId, onSuccess }) {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        compound_area: '',
        family_size: '',
        special_needs: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const addRecipient = useAddRecipient()
    const createPerson = useCreatePerson()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            // 1. Create Person
            const personData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone_number: formData.phone_number,
                compound_area: formData.compound_area,
                is_active: true
            }

            const newPerson = await createPerson.mutateAsync(personData)

            // 2. Add to Distribution
            await addRecipient.mutateAsync({
                distribution_id: distributionId,
                family_head_id: newPerson.id,
                family_size: parseInt(formData.family_size),
                special_needs: formData.special_needs,
                // family_group_id is null for now
            })

            setSuccess('Person registered and recorded successfully!')

            // Wait a moment before closing
            setTimeout(() => {
                onSuccess()
            }, 1000)

        } catch (err) {
            console.error(err)
            setError(err.message || 'Failed to create person and record distribution')
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                        id="firstName"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                        id="lastName"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                    id="phone"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+260..."
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="compound">Compound/Area</Label>
                <Input
                    id="compound"
                    value={formData.compound_area}
                    onChange={(e) => setFormData({ ...formData, compound_area: e.target.value })}
                    placeholder="e.g., Kanyama"
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="newFamilySize">Family Size *</Label>
                <Input
                    id="newFamilySize"
                    type="number"
                    min="1"
                    value={formData.family_size}
                    onChange={(e) => setFormData({ ...formData, family_size: e.target.value })}
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="newSpecialNeeds">Special Needs (Optional)</Label>
                <Textarea
                    id="newSpecialNeeds"
                    value={formData.special_needs}
                    onChange={(e) => setFormData({ ...formData, special_needs: e.target.value })}
                    rows={3}
                    disabled={isSubmitting}
                />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={onSuccess} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-brand-600 hover:bg-brand-700">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create & Add to List
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}

