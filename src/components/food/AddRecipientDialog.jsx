import { useState } from 'react'
import { usePeople } from '@/hooks/usePeople'
import { useAddRecipient } from '@/hooks/useFoodDistribution'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'

export function AddRecipientDialog({ open, onOpenChange, distributionId }) {
    const [activeTab, setActiveTab] = useState('existing')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPerson, setSelectedPerson] = useState(null)
    const [familySize, setFamilySize] = useState('')
    const [specialNeeds, setSpecialNeeds] = useState('')

    const { data: people } = usePeople()
    const addRecipient = useAddRecipient()

    const filteredPeople = people?.filter((person) => {
        const fullName = `${person.first_name} ${person.last_name}`.toLowerCase()
        const phone = person.phone_number || ''
        return fullName.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery)
    })

    const handleAddExisting = async (e) => {
        e.preventDefault()
        if (!selectedPerson) return

        try {
            await addRecipient.mutateAsync({
                distribution_id: distributionId,
                family_head_id: selectedPerson.id,
                family_size: parseInt(familySize) || 1,
                special_needs: specialNeeds || null,
            })
            onOpenChange(false)
            resetForm()
        } catch (err) {
            console.error('Failed to add recipient:', err)
        }
    }

    const resetForm = () => {
        setSelectedPerson(null)
        setFamilySize('')
        setSpecialNeeds('')
        setSearchQuery('')
        setActiveTab('existing')
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
                        Search for an existing person or add a new one to the distribution list.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="existing">Existing Person</TabsTrigger>
                        <TabsTrigger value="new">New Person</TabsTrigger>
                    </TabsList>

                    <TabsContent value="existing" className="space-y-4">
                        {/* Search */}
                        <div className="relative">
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
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={person.photo_url} />
                                                    <AvatarFallback>
                                                        {person.first_name?.charAt(0)}
                                                        {person.last_name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
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
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="text-sm text-neutral-600">Selected Family Head</div>
                                    <div className="font-semibold text-neutral-900">
                                        {selectedPerson.first_name} {selectedPerson.last_name}
                                    </div>
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

    const addRecipient = useAddRecipient()

    const handleSubmit = async (e) => {
        e.preventDefault()

        // This would need a new hook to create person + recipient in one transaction
        // For now, we'll show a message to use existing person flow
        alert('Please use the "Existing Person" tab and add the person to the system first via the People section.')
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                        id="firstName"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                        id="lastName"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
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
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="compound">Compound/Area</Label>
                <Input
                    id="compound"
                    value={formData.compound_area}
                    onChange={(e) => setFormData({ ...formData, compound_area: e.target.value })}
                    placeholder="e.g., Kanyama"
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
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="newSpecialNeeds">Special Needs (Optional)</Label>
                <Textarea
                    id="newSpecialNeeds"
                    value={formData.special_needs}
                    onChange={(e) => setFormData({ ...formData, special_needs: e.target.value })}
                    rows={3}
                />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                    <strong>Note:</strong> To add a completely new person, please first register them in the People section,
                    then return here to add them as a recipient.
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" disabled>
                    Coming Soon
                </Button>
            </div>
        </form>
    )
}
