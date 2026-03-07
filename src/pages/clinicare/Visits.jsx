import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useVisits } from '@/hooks/useVisits'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { VisitsTable } from '@/components/clinicare/VisitsTable'
import { VisitForm } from '@/components/clinicare/VisitForm'
import { Heart, Plus, Filter, Search, Printer } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSearchParams } from 'react-router-dom'
import { RegistrationFilter } from '@/components/shared/RegistrationFilter'
import { formatDate } from '@/lib/utils'

export function Visits() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [showAddVisit, setShowAddVisit] = useState(false)

    // Persist all filter state in URL params
    const emergencyFilter = searchParams.get('type') ?? 'all'
    const programFilter = searchParams.get('program') ?? 'all'
    const followUpFilter = searchParams.get('filter') === 'follow-ups'
    const startDate = searchParams.get('from') ?? ''
    const endDate = searchParams.get('to') ?? ''

    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('search') ?? '')

    const setParam = (key, val) => setSearchParams(prev => {
        const p = new URLSearchParams(prev)
        val ? p.set(key, val) : p.delete(key)
        return p
    }, { replace: true })

    const setEmergencyFilter = (val) => setParam('type', val === 'all' ? '' : val)
    const setProgramFilter = (val) => setParam('program', val === 'all' ? '' : val)
    const setStartDate = (val) => setParam('from', val)
    const setEndDate = (val) => setParam('to', val)
    const setFollowUpFilter = (on) => setParam('filter', on ? 'follow-ups' : '')

    useEffect(() => {
        const timer = setTimeout(() => {
            const trimmed = searchInput.trim()
            setDebouncedQuery(trimmed)
            setSearchParams(prev => {
                const p = new URLSearchParams(prev)
                trimmed ? p.set('search', trimmed) : p.delete('search')
                return p
            }, { replace: true })
        }, 300)
        return () => clearTimeout(timer)
    }, [searchInput])

    const { data: visits, isLoading } = useVisits({
        search: debouncedQuery,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isEmergency: emergencyFilter === 'yes' ? true : emergencyFilter === 'no' ? false : undefined,
        inProgram: programFilter === 'registered' ? true : programFilter === 'non-registered' ? false : undefined,
        followUpRequired: followUpFilter || undefined,
    })

    const handlePrint = () => {
        const rows = (visits || []).map((v, i) => {
            const patient = v.patient ? `${v.patient.first_name || ''} ${v.patient.last_name || ''}`.trim() : 'Unknown'
            return `<tr>
                <td>${i + 1}</td>
                <td>${formatDate(v.visit_date) || '-'}</td>
                <td>${patient}</td>
                <td>${v.is_emergency ? 'Emergency' : 'Regular'}</td>
                <td>${v.facility?.facility_name || v.facility_name || '-'}</td>
                <td>${v.diagnosis || '-'}</td>
            </tr>`
        }).join('')

        const html = `<!doctype html><html><head><meta charset="utf-8"/>
            <title>Medical Visits</title>
            <style>body{font-family:Arial,sans-serif;padding:20px;color:#111;}h1{margin-bottom:4px;}
            .meta{color:#555;font-size:13px;margin-bottom:16px;}
            table{width:100%;border-collapse:collapse;}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;}
            th{background:#f5f5f5;}</style></head>
            <body><h1>Medical Visits</h1>
            <div class="meta">Generated ${new Date().toLocaleDateString()} · ${(visits || []).length} visits</div>
            <table><thead><tr><th>#</th><th>Date</th><th>Patient</th><th>Type</th><th>Facility</th><th>Diagnosis</th></tr></thead>
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
                    title="Medical Visits"
                    description={`${visits?.length || 0} total visits recorded`}
                    action={() => setShowAddVisit(true)}
                    actionLabel="Record Visit"
                    actionIcon={Plus}
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
                className="flex flex-col sm:flex-row gap-4 flex-wrap"
            >
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                        placeholder="Search patient name..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
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

                <RegistrationFilter
                    value={programFilter}
                    onChange={setProgramFilter}
                    label="Member Type"
                />

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
                        setSearchInput('')
                        setSearchParams({}, { replace: true })
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

