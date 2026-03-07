import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWomen } from '@/hooks/useWomen'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { WomenTable } from '@/components/legacy/WomenTable'
import { WomenForm } from '@/components/legacy/WomenForm'
import { UserPlus, Users, Printer } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LEGACY_STAGES, LEGACY_STATUS } from '@/lib/constants'
import { Search, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function Participants() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const stageFilter = searchParams.get('stage') ?? 'all'
    const statusFilter = searchParams.get('status') ?? 'Active'

    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') ?? '')
    const [showAddWoman, setShowAddWoman] = useState(false)
    const [sorting, setSorting] = useState([{ id: 'enrollment_date', desc: true }])

    const setParam = (key, val) => setSearchParams(prev => {
        const p = new URLSearchParams(prev)
        p.set(key, val)
        return p
    }, { replace: true })

    const setStageFilter = (val) => setParam('stage', val)
    const setStatusFilter = (val) => setParam('status', val)

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const trimmed = searchInput.trim()
            setDebouncedSearch(trimmed)
            setSearchParams(prev => {
                const p = new URLSearchParams(prev)
                trimmed ? p.set('search', trimmed) : p.delete('search')
                return p
            }, { replace: true })
        }, 300)
        return () => window.clearTimeout(timer)
    }, [searchInput])

    const { data: women, isLoading } = useWomen({
        search: debouncedSearch,
        stage: stageFilter === 'all' ? undefined : stageFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc'
    })

    const handlePrint = () => {
        const rows = (women || []).map((w, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${(w.first_name || '')} ${(w.last_name || '')}</td>
                <td>${w.stage || '-'}</td>
                <td>${w.status || '-'}</td>
                <td>${formatDate(w.enrollment_date) || '-'}</td>
            </tr>
        `).join('')

        const html = `<!doctype html><html><head><meta charset="utf-8"/>
            <title>Legacy Participants</title>
            <style>body{font-family:Arial,sans-serif;padding:20px;color:#111;}h1{margin-bottom:4px;}
            .meta{color:#555;font-size:13px;margin-bottom:16px;}
            table{width:100%;border-collapse:collapse;}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;}
            th{background:#f5f5f5;}</style></head>
            <body><h1>Legacy Women's Program — Participants</h1>
            <div class="meta">Generated ${new Date().toLocaleDateString()} · ${(women || []).length} participants</div>
            <table><thead><tr><th>#</th><th>Name</th><th>Stage</th><th>Status</th><th>Enrollment Date</th></tr></thead>
            <tbody>${rows}</tbody></table></body></html>`

        const win = window.open('', '_blank')
        if (!win) return
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Participants"
                    description={`${women?.length || 0} women in Legacy Women's Program`}
                    action={() => setShowAddWoman(true)}
                    actionLabel="Register Woman"
                    actionIcon={UserPlus}
                />
                <Button variant="outline" onClick={handlePrint} className="shrink-0">
                    <Printer className="mr-2 h-4 w-4" />
                    Print List
                </Button>
            </div>

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
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
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
                    sorting={sorting}
                    onSortingChange={setSorting}
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

