// ... (start of file)
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Users, Calendar, Plus, History, Search } from 'lucide-react'
import { useEmergencyDistributions } from '@/hooks/useEmergencyRelief'
import { usePeople } from '@/hooks/usePeople'
import { EmergencyDistributionForm } from '@/components/emergency-relief/EmergencyDistributionForm'
import { RegistrationFilter } from '@/components/shared/RegistrationFilter'
import { RecipientHistory } from '@/components/emergency-relief/RecipientHistory'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export default function EmergencyReliefOverview() {
    const navigate = useNavigate()
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showHistorySearch, setShowHistorySearch] = useState(false)
    const [selectedRecipient, setSelectedRecipient] = useState(null)
    const [registrationFilter, setRegistrationFilter] = useState('all')
    const { data: distributions, isLoading } = useEmergencyDistributions()

    const filteredDistributions = useMemo(() => {
        if (!distributions) return []
        if (registrationFilter === 'all') return distributions

        const isRegistered = registrationFilter === 'registered'

        return distributions.map(dist => ({
            ...dist,
            recipients: dist.recipients?.filter(r => {
                const memberStatus = r.family_head?.is_registered_member ?? true // Default to true if undefined
                return memberStatus === isRegistered
            }) || []
        })).filter(dist => dist.recipients.length > 0)
    }, [distributions, registrationFilter])

    const recentDistributions = filteredDistributions?.slice(0, 5) || []
    const totalDistributions = filteredDistributions?.length || 0
    const totalFamiliesHelped = filteredDistributions?.reduce((sum, d) => sum + (d.recipients?.length || 0), 0) || 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Emergency Relief</h1>
                    <p className="text-muted-foreground">
                        Manage emergency food hamper distributions for vulnerable families
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <RegistrationFilter
                        value={registrationFilter}
                        onChange={setRegistrationFilter}
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setShowHistorySearch(true)}>
                            <History className="mr-2 h-4 w-4" />
                            History
                        </Button>
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Distributions</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDistributions}</div>
                        <p className="text-xs text-muted-foreground">Matching distributions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Families Helped</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFamiliesHelped}</div>
                        <p className="text-xs text-muted-foreground">Unique families assisted</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredDistributions?.filter(d => {
                                const date = new Date(d.distribution_date)
                                const now = new Date()
                                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                            }).length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Distributions this month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Distributions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Distributions</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground">Loading...</p>
                    ) : recentDistributions.length === 0 ? (
                        <p className="text-muted-foreground">No distributions found matching criteria</p>
                    ) : (
                        <div className="space-y-3">
                            {recentDistributions.map((dist) => (
                                <div
                                    key={dist.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {new Date(dist.distribution_date).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {dist.reason || 'Emergency relief distribution'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{dist.recipients?.length || 0} families</div>
                                        <div className="text-sm text-muted-foreground">
                                            {dist.recipients?.filter(r => r.collected).length || 0} collected
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Distribution Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Emergency Distribution</DialogTitle>
                    </DialogHeader>
                    <EmergencyDistributionForm
                        onSuccess={() => setShowCreateDialog(false)}
                        onCancel={() => setShowCreateDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* History Search Dialog */}
            <RecipientSearchDialog
                open={showHistorySearch}
                onOpenChange={setShowHistorySearch}
                onSelect={(person) => {
                    setSelectedRecipient({ family_head: person }) // Adapt structure for RecipientHistory
                    setShowHistorySearch(false)
                }}
            />

            {/* History View Dialog */}
            {selectedRecipient && (
                <RecipientHistory
                    recipient={selectedRecipient}
                    open={!!selectedRecipient}
                    onOpenChange={(open) => !open && setSelectedRecipient(null)}
                />
            )}
        </div>
    )
}

function RecipientSearchDialog({ open, onOpenChange, onSelect }) {
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Simple debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    const { data: people, isLoading } = usePeople(debouncedSearch)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Search Recipient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    <div className="h-[300px] overflow-y-auto border rounded-md p-2 space-y-1">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner />
                            </div>
                        ) : people?.length > 0 ? (
                            people.map(person => (
                                <div
                                    key={person.id}
                                    className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                                    onClick={() => onSelect(person)}
                                >
                                    <PersonAvatar
                                        firstName={person.first_name}
                                        lastName={person.last_name}
                                        photoUrl={person.photo_url}
                                        gender={person.gender}
                                        className="h-8 w-8"
                                    />
                                    <div>
                                        <div className="text-sm font-medium">
                                            {person.first_name} {person.last_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {person.phone_number || 'No phone'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                {debouncedSearch ? 'No people found' : 'Start typing to search...'}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
