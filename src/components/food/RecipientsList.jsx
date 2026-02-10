import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Search, Check, Trash2, Users, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

function getChildrenNames(recipient, familyHead) {
    const parentFullName = `${familyHead?.first_name || ''} ${familyHead?.last_name || ''}`.trim().toLowerCase()
    const rawNames = Array.isArray(recipient.family_member_names) ? recipient.family_member_names : []

    return rawNames
        .map((name) => (name || '').trim())
        .filter(Boolean)
        .filter((name) => name.toLowerCase() !== parentFullName)
}

export function RecipientsList({ recipients, viewMode, onMarkCollected, onRemoveRecipient, onAddRecipient }) {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter recipients by search
    const filteredRecipients = recipients.filter((recipient) => {
        const displayPerson = recipient.primary_person || recipient.family_head
        const fullName = `${displayPerson?.first_name} ${displayPerson?.last_name}`.toLowerCase()
        const phone = displayPerson?.phone_number || ''
        return fullName.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery)
    })

    // Separate collected and pending
    const pending = filteredRecipients.filter(r => !r.collection_time)
    const collected = filteredRecipients.filter(r => r.collection_time)

    if (viewMode === 'checkin') {
        return <CheckInView
            pending={pending}
            collected={collected}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onMarkCollected={onMarkCollected}
        />
    }

    return (
        <div className="space-y-4">
            {/* Search and Add */}
            <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                        placeholder="Search recipients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={onAddRecipient}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                </Button>
            </div>

            {/* Pending Recipients */}
            {pending.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>Pending Collection ({pending.length})</span>
                            <Badge variant="secondary">{pending.length} remaining</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-neutral-100">
                            <AnimatePresence>
                                {pending.map((recipient, index) => (
                                    <RecipientCard
                                        key={recipient.id}
                                        recipient={recipient}
                                        index={index}
                                        onMarkCollected={onMarkCollected}
                                        onRemove={onRemoveRecipient}
                                        isPending={true}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Collected Recipients */}
            {collected.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>Collected ({collected.length})</span>
                            <Badge variant="success">{collected.length} completed</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-neutral-100">
                            <AnimatePresence>
                                {collected.map((recipient, index) => (
                                    <RecipientCard
                                        key={recipient.id}
                                        recipient={recipient}
                                        index={index}
                                        isPending={false}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            )}

            {filteredRecipients.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <div className="text-neutral-500">
                            {recipients.length === 0
                                ? 'No recipients added yet'
                                : 'No recipients match your search'}
                        </div>
                        {recipients.length === 0 && (
                            <Button onClick={onAddRecipient} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Recipient
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function RecipientCard({ recipient, index, onMarkCollected, onRemove, isPending }) {
    const familyHead = recipient.primary_person || recipient.family_head
    const childrenNames = getChildrenNames(recipient, familyHead)

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
            className="p-4 hover:bg-neutral-50 transition-colors"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                    <PersonAvatar
                        photoUrl={familyHead?.photo_url}
                        gender={familyHead?.gender}
                        firstName={familyHead?.first_name}
                        lastName={familyHead?.last_name}
                        className="h-12 w-12"
                    />

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold text-neutral-900">
                                {familyHead?.first_name} {familyHead?.last_name}
                            </div>
                            {recipient.family_group_id && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-600 border-blue-200">
                                    <Users className="w-2 h-2 mr-1" />
                                    Household
                                </Badge>
                            )}
                        </div>
                        <div className="text-sm text-neutral-600 flex flex-wrap items-center gap-x-2">
                            <span className="font-medium">Family of {recipient.family_size || 'N/A'}</span>
                            {familyHead?.phone_number && (
                                <>
                                    <span>&bull;</span>
                                    <span>{familyHead.phone_number}</span>
                                </>
                            )}
                            {recipient.collection_time && (
                                <>
                                    <span>&bull;</span>
                                    <span className="text-green-600">
                                        Collected {formatDate(recipient.collection_time)}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Children List */}
                        {childrenNames.length > 0 && (
                            <div className="mt-1 text-sm text-neutral-700">
                                <span className="font-medium">Children:</span> {childrenNames.join(', ')}
                            </div>
                        )}

                        {recipient.special_needs && (
                            <div className="text-sm text-neutral-500 mt-1 italic">
                                Note: {recipient.special_needs}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {isPending ? (
                        <>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => onMarkCollected(recipient.id)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Mark Collected
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(recipient.id)}
                            >
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                        </>
                    ) : (
                        <Badge variant="success">
                            <Check className="h-3 w-3 mr-1" />
                            Collected
                        </Badge>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

function CheckInView({ pending, collected, searchQuery, setSearchQuery, onMarkCollected }) {
    return (
        <div className="space-y-4">
            {/* Mobile-optimized header */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-green-600 mb-2">
                            {collected.length}/{pending.length + collected.length}
                        </div>
                        <div className="text-neutral-600">Hampers Collected</div>
                    </div>
                </CardContent>
            </Card>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg"
                />
            </div>

            {/* Pending Recipients - Large Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Collection ({pending.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-neutral-100">
                        {pending.map((recipient) => {
                            const familyHead = recipient.primary_person || recipient.family_head
                            const childrenNames = getChildrenNames(recipient, familyHead)

                            return (
                                <div key={recipient.id} className="p-4">
                                    <div className="mb-3">
                                        <div className="font-semibold text-lg text-neutral-900">
                                            {familyHead?.first_name} {familyHead?.last_name}
                                        </div>
                                        <div className="text-neutral-600 flex items-center gap-2">
                                            <span>Family of {recipient.family_size}</span>
                                            {familyHead?.phone_number && <span>&bull; {familyHead.phone_number}</span>}
                                        </div>
                                        {/* Children List */}
                                        {childrenNames.length > 0 && (
                                            <div className="mt-1 text-sm text-neutral-700">
                                                <span className="font-medium">Children:</span> {childrenNames.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => onMarkCollected(recipient.id)}
                                        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                                        size="lg"
                                    >
                                        <Check className="h-5 w-5 mr-2" />
                                        Check In
                                    </Button>
                                </div>
                            )
                        })}
                        {pending.length === 0 && (
                            <div className="p-12 text-center text-neutral-500">
                                All hampers collected! Done.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
