import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { SortableTable } from '@/components/shared/SortableTable'
import { Search, Check, Trash2, Users, Plus, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { RegistrationFilter } from '@/components/shared/RegistrationFilter'

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
    const [registrationFilter, setRegistrationFilter] = useState('all')

    // Filter recipients by search and registration
    const filteredRecipients = useMemo(() => {
        return recipients.filter((recipient) => {
            const displayPerson = recipient.primary_person || recipient.family_head
            const fullName = `${displayPerson?.first_name} ${displayPerson?.last_name}`.toLowerCase()
            const phone = displayPerson?.phone_number || ''
            const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery)

            if (!matchesSearch) return false

            if (registrationFilter === 'all') return true

            const isRegistered = registrationFilter === 'registered'
            const memberStatus = displayPerson?.is_registered_member ?? true
            return memberStatus === isRegistered
        })
    }, [recipients, searchQuery, registrationFilter])

    const columns = useMemo(() => [
        {
            accessorKey: 'family_head.first_name',
            header: 'Recipient',
            cell: ({ row }) => {
                const recipient = row.original
                const familyHead = recipient.primary_person || recipient.family_head
                const childrenNames = getChildrenNames(recipient, familyHead)

                return (
                    <div className="flex items-center space-x-3">
                        <PersonAvatar
                            photoUrl={familyHead?.photo_url}
                            gender={familyHead?.gender}
                            firstName={familyHead?.first_name}
                            lastName={familyHead?.last_name}
                            className="h-10 w-10 flex-shrink-0"
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-neutral-900 truncate">
                                    {familyHead?.first_name} {familyHead?.last_name}
                                </span>
                                {recipient.family_group_id && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-600 border-blue-200">
                                        Household
                                    </Badge>
                                )}
                            </div>
                            {childrenNames.length > 0 && (
                                <div className="text-[11px] text-neutral-500 truncate max-w-[200px]">
                                    {childrenNames.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: 'family_size',
            header: 'Size',
            cell: ({ row }) => (
                <div className="text-center font-medium">
                    {row.original.family_size || 1}
                </div>
            ),
        },
        {
            accessorKey: 'family_head.phone_number',
            header: 'Phone',
            cell: ({ row }) => {
                const person = row.original.primary_person || row.original.family_head
                return <div className="text-sm">{person?.phone_number || '-'}</div>
            },
        },
        {
            accessorKey: 'collection_time',
            header: 'Status',
            cell: ({ row }) => {
                const isCollected = !!row.original.collection_time
                return (
                    <div className="flex justify-center">
                        {isCollected ? (
                            <Badge variant="success" className="flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Collected
                            </Badge>
                        ) : (
                            <Badge variant="secondary">Pending</Badge>
                        )}
                    </div>
                )
            },
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex items-center justify-end space-x-1">
                    {!row.original.collection_time && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                                e.stopPropagation()
                                onMarkCollected(row.original.id)
                            }}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemoveRecipient(row.original.id)
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], [onMarkCollected, onRemoveRecipient])

    if (viewMode === 'checkin') {
        const pending = filteredRecipients.filter(r => !r.collection_time)
        const collected = filteredRecipients.filter(r => !!r.collection_time)
        return (
            <CheckInView
                pending={pending}
                collected={collected}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onMarkCollected={onMarkCollected}
            />
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <RegistrationFilter
                        value={registrationFilter}
                        onChange={setRegistrationFilter}
                    />
                </div>
                <Button onClick={onAddRecipient}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                </Button>
            </div>

            <SortableTable
                columns={columns}
                data={filteredRecipients}
                emptyMessage={recipients.length === 0 ? "No recipients added yet" : "No recipients match your search"}
            />
        </div>
    )
}

function CheckInView({ pending, collected, searchQuery, setSearchQuery, onMarkCollected }) {
    return (
        <div className="space-y-4">
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

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg bg-white"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Pending Collection</span>
                        <Badge variant="secondary">{pending.length} remaining</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-neutral-100">
                        {pending.map((recipient) => {
                            const familyHead = recipient.primary_person || recipient.family_head
                            const childrenNames = getChildrenNames(recipient, familyHead)

                            return (
                                <div key={recipient.id} className="p-4 bg-white">
                                    <div className="mb-3">
                                        <div className="font-semibold text-lg text-neutral-900">
                                            {familyHead?.first_name} {familyHead?.last_name}
                                        </div>
                                        <div className="text-neutral-600 flex items-center gap-2">
                                            <span>Family of {recipient.family_size || 1}</span>
                                            {familyHead?.phone_number && <span>&bull; {familyHead.phone_number}</span>}
                                        </div>
                                        {childrenNames.length > 0 && (
                                            <div className="mt-1 text-sm text-neutral-700">
                                                <span className="font-medium text-neutral-500">Children:</span> {childrenNames.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => onMarkCollected(recipient.id)}
                                        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-md"
                                        size="lg"
                                    >
                                        <Check className="h-5 w-5 mr-2" />
                                        Check In
                                    </Button>
                                </div>
                            )
                        })}
                        {pending.length === 0 && (
                            <div className="p-12 text-center text-neutral-500 italic bg-white">
                                All hampers collected! Done.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {collected.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-neutral-500">Recently Collected</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-neutral-100">
                            {collected.slice(0, 5).map((recipient) => (
                                <div key={recipient.id} className="p-3 flex justify-between items-center bg-neutral-50/50">
                                    <div className="text-sm font-medium">
                                        {recipient.primary_person?.first_name || recipient.family_head?.first_name} {recipient.primary_person?.last_name || recipient.family_head?.last_name}
                                    </div>
                                    <Badge variant="success" className="h-5">Collected</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
