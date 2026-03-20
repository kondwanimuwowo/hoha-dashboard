import { useState, useEffect, useMemo, useCallback } from 'react'
import { useBeforeUnload } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Search, Save, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function DewormingRecordSheet({ records, event, onSave, isSaving }) {
    const [localRecords, setLocalRecords] = useState({})
    const [initialSnapshot, setInitialSnapshot] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [isAutoSaving, setIsAutoSaving] = useState(false)
    const [lastSavedAt, setLastSavedAt] = useState(null)

    // Initialize local state from fetched records
    useEffect(() => {
        const map = {}
        for (const r of records || []) {
            map[r.child_id] = {
                id: r.id,
                child_id: r.child_id,
                weight_kg: r.weight_kg ?? '',
                height_cm: r.height_cm ?? '',
                administered: r.administered || false,
                notes: r.notes || '',
                child: r.child,
                grade_level: r.grade_level,
            }
        }
        setLocalRecords(map)
        setInitialSnapshot(map)
    }, [records])

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(localRecords) !== JSON.stringify(initialSnapshot),
        [localRecords, initialSnapshot]
    )

    const isPersisting = isSaving || isAutoSaving

    useBeforeUnload((e) => {
        if (!hasUnsavedChanges || isPersisting) return
        e.preventDefault()
        e.returnValue = 'You have unsaved deworming records.'
    })

    const updateRecord = (childId, field, value) => {
        setLocalRecords((prev) => ({
            ...prev,
            [childId]: { ...prev[childId], [field]: value },
        }))
    }

    const markAllAdministered = () => {
        setLocalRecords((prev) => {
            const next = { ...prev }
            for (const key of Object.keys(next)) {
                next[key] = { ...next[key], administered: true }
            }
            return next
        })
    }

    const persistRecords = useCallback(async (snapshot, { auto = false } = {}) => {
        if (auto) setIsAutoSaving(true)

        const recordsList = Object.values(snapshot).map((r) => ({
            id: r.id,
            child_id: r.child_id,
            weight_kg: r.weight_kg === '' ? null : Number(r.weight_kg),
            height_cm: r.height_cm === '' ? null : Number(r.height_cm),
            administered: r.administered,
            notes: r.notes,
        }))

        try {
            await onSave(recordsList)
            setInitialSnapshot(snapshot)
            setLastSavedAt(new Date())
        } finally {
            if (auto) setIsAutoSaving(false)
        }
    }, [onSave])

    const handleSave = async () => {
        await persistRecords(localRecords, { auto: false })
    }

    // Auto-save after 30s of inactivity
    useEffect(() => {
        if (!hasUnsavedChanges || isPersisting) return

        const timer = window.setTimeout(() => {
            void persistRecords(localRecords, { auto: true })
        }, 30000)

        return () => window.clearTimeout(timer)
    }, [localRecords, hasUnsavedChanges, isPersisting, persistRecords])

    const recordsList = Object.values(localRecords)
    const total = recordsList.length
    const administered = recordsList.filter((r) => r.administered).length

    const filteredRecords = recordsList
        .filter((r) => {
            if (!searchQuery) return true
            const name = `${r.child?.first_name} ${r.child?.last_name}`.toLowerCase()
            return name.includes(searchQuery.toLowerCase())
        })
        .sort((a, b) => {
            const nameA = `${a.child?.first_name} ${a.child?.last_name}`
            const nameB = `${b.child?.first_name} ${b.child?.last_name}`
            return nameA.localeCompare(nameB)
        })

    return (
        <div className="space-y-4">
            {/* Summary bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="font-semibold text-green-600">{administered}</span>
                                <span className="text-neutral-600">of {total} administered</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button onClick={markAllAdministered} variant="outline" size="sm">
                                Mark All Administered
                            </Button>
                            <Button onClick={handleSave} disabled={isPersisting} size="sm">
                                <Save className="mr-2 h-4 w-4" />
                                {isPersisting ? 'Saving...' : 'Save Records'}
                            </Button>
                        </div>
                    </div>
                    {(hasUnsavedChanges || isAutoSaving || lastSavedAt) && (
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            {isAutoSaving
                                ? 'Autosaving records...'
                                : hasUnsavedChanges
                                    ? 'You have unsaved changes. Autosave runs every 30 seconds.'
                                    : `Last saved at ${lastSavedAt?.toLocaleTimeString()}`}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Records list */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {filteredRecords.length} Student{filteredRecords.length !== 1 ? 's' : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table header */}
                    <div className="hidden md:grid md:grid-cols-[1fr_120px_120px_100px] gap-3 px-4 py-2 border-b bg-neutral-50 text-sm font-medium text-neutral-600">
                        <div>Student</div>
                        <div>Weight (kg)</div>
                        <div>Height (cm)</div>
                        <div>Administered</div>
                    </div>

                    <div className="divide-y divide-neutral-100">
                        <AnimatePresence>
                            {filteredRecords.map((record, index) => (
                                <motion.div
                                    key={record.child_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.5) }}
                                    className={cn(
                                        'p-4 hover:bg-neutral-50 transition-colors',
                                        record.administered && 'bg-green-50/50'
                                    )}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_100px] gap-3 items-center">
                                        {/* Student info */}
                                        <div className="flex items-center gap-3">
                                            <PersonAvatar
                                                photoUrl={record.child?.photo_url}
                                                gender={record.child?.gender}
                                                firstName={record.child?.first_name}
                                                lastName={record.child?.last_name}
                                                className="h-10 w-10"
                                            />
                                            <div>
                                                <div className="font-semibold text-neutral-900">
                                                    {record.child?.first_name} {record.child?.last_name}
                                                </div>
                                                <div className="text-sm text-neutral-500">
                                                    {record.grade_level || 'No grade'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Weight */}
                                        <div>
                                            <label className="md:hidden text-xs text-neutral-500 mb-1 block">Weight (kg)</label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="kg"
                                                value={record.weight_kg}
                                                onChange={(e) => updateRecord(record.child_id, 'weight_kg', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>

                                        {/* Height */}
                                        <div>
                                            <label className="md:hidden text-xs text-neutral-500 mb-1 block">Height (cm)</label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="cm"
                                                value={record.height_cm}
                                                onChange={(e) => updateRecord(record.child_id, 'height_cm', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>

                                        {/* Administered checkbox */}
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={record.administered}
                                                onCheckedChange={(checked) =>
                                                    updateRecord(record.child_id, 'administered', !!checked)
                                                }
                                                id={`admin-${record.child_id}`}
                                            />
                                            <label
                                                htmlFor={`admin-${record.child_id}`}
                                                className="text-sm cursor-pointer md:hidden"
                                            >
                                                Administered
                                            </label>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
