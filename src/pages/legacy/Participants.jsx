import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWomen } from '@/hooks/useWomen'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { WomenTable } from '@/components/legacy/WomenTable'
import { WomenForm } from '@/components/legacy/WomenForm'
import { UserPlus, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LEGACY_STAGES, LEGACY_STATUS } from '@/lib/constants'
import { Search, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

export function Participants() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [stageFilter, setStageFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('Active')
    const [showAddWoman, setShowAddWoman] = useState(false)

    const { data: women, isLoading } = useWomen({
        search,
        stage: stageFilter === 'all' ? undefined : stageFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
    })

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Participants"
                description={`${women?.length || 0} women in Legacy Women's Program`}
                action={() => setShowAddWoman(true)}
                actionLabel="Register Woman"
                actionIcon={UserPlus}
            />

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {LEGACY_STAGES.map((stage) => (
                            <SelectItem key={stage} value={stage}>
                                {stage}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.values(LEGACY_STATUS).map((status) => (
                            <SelectItem key={status} value={status}>
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Table */}
            {women && women.length > 0 ? (
                <WomenTable
                    data={women}
                    onRowClick={(woman) => navigate(`/legacy/participants/${woman.woman_id}`)}
                />
            ) : (
                <EmptyState
                    icon={Users}
                    title="No participants found"
                    description="Get started by registering your first participant"
                    action={() => setShowAddWoman(true)}
                    actionLabel="Register Woman"
                />
            )}

            {/* Add Woman Dialog */}
            <Dialog open={showAddWoman} onOpenChange={setShowAddWoman}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Register New Participant</DialogTitle>
                    </DialogHeader>
                    <WomenForm
                        onSuccess={() => setShowAddWoman(false)}
                        onCancel={() => setShowAddWoman(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
