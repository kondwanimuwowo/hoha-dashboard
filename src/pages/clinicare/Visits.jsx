import { useState } from 'react'
import { useVisits } from '@/hooks/useVisits'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { VisitsTable } from '@/components/clinicare/VisitsTable'
import { VisitForm } from '@/components/clinicare/VisitForm'
import { Heart, Plus, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSearchParams } from 'react-router-dom'

export function Visits() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [showAddVisit, setShowAddVisit] = useState(false)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [emergencyFilter, setEmergencyFilter] = useState('all')
    const [programFilter, setProgramFilter] = useState('all')
    const [followUpFilter, setFollowUpFilter] = useState(searchParams.get('filter') === 'follow-ups')

    const { data: visits, isLoading } = useVisits({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isEmergency: emergencyFilter === 'yes' ? true : emergencyFilter === 'no' ? false : undefined,
        inProgram: programFilter === 'yes' ? true : programFilter === 'no' ? false : undefined,
        followUpRequired: followUpFilter || undefined,
    })

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Medical Visits"
                description={`${visits?.length || 0} total visits recorded`}
                action={() => setShowAddVisit(true)}
                actionLabel="Record Visit"
                actionIcon={Plus}
            />

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="grid grid-cols-2 gap-2 flex-1">
                    <Input
                        type="date"
                        placeholder="Start Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        type="date"
                        placeholder="End Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <Select value={emergencyFilter} onValueChange={setEmergencyFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="yes">Emergency Only</SelectItem>
                        <SelectItem value="no">Regular Only</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={programFilter} onValueChange={setProgramFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Patients" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Patients</SelectItem>
                        <SelectItem value="yes">Program Members</SelectItem>
                        <SelectItem value="no">Community</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    variant={followUpFilter ? "default" : "outline"}
                    onClick={() => setFollowUpFilter(!followUpFilter)}
                    className="shrink-0"
                >
                    Follow-ups
                </Button>

                <Button
                    variant="outline"
                    onClick={() => {
                        setStartDate('')
                        setEndDate('')
                        setEmergencyFilter('all')
                        setProgramFilter('all')
                        setFollowUpFilter(false)
                        setSearchParams({})
                    }}
                >
                    Reset
                </Button>
            </motion.div>

            {/* Table */}
            {visits && visits.length > 0 ? (
                <VisitsTable data={visits} />
            ) : (
                <EmptyState
                    icon={Heart}
                    title="No visits found"
                    description="Record your first medical visit"
                    action={() => setShowAddVisit(true)}
                    actionLabel="Record Visit"
                />
            )}

            {/* Add Visit Dialog */}
            <Dialog open={showAddVisit} onOpenChange={setShowAddVisit}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record Medical Visit</DialogTitle>
                    </DialogHeader>
                    <VisitForm
                        onSuccess={() => setShowAddVisit(false)}
                        onCancel={() => setShowAddVisit(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
