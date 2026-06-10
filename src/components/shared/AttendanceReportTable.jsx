import { useMemo, useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'

export function AttendanceReportTable({ data, isLoading, type = 'students' }) {
    // Default sort: alphabetical by name (matches the report's default order)
    const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

    const toggleSort = (key) => {
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'asc' }
        )
    }

    const participants = type === 'students' ? data?.students : data?.women

    const sortedParticipants = useMemo(() => {
        if (!participants) return []
        const groupKey = type === 'students' ? 'grade' : 'stage'
        const rows = [...participants]
        rows.sort((a, b) => {
            let valA = sort.key === 'group' ? a[groupKey] : a[sort.key]
            let valB = sort.key === 'group' ? b[groupKey] : b[sort.key]
            let result
            if (typeof valA === 'number' || typeof valB === 'number') {
                result = (valA ?? 0) - (valB ?? 0)
            } else {
                result = String(valA ?? '').localeCompare(String(valB ?? ''))
            }
            return sort.dir === 'asc' ? result : -result
        })
        return rows
    }, [participants, sort, type])

    if (isLoading) return <LoadingSpinner />

    if (!data || (type === 'students' && !data.students?.length) || (type === 'women' && !data.women?.length)) {
        return (
            <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                    No attendance data found for this period
                </CardContent>
            </Card>
        )
    }

    const summary = data.summary

    const SortableHeader = ({ sortKey, children, align = 'left' }) => {
        const active = sort.key === sortKey
        return (
            <th className={cn('p-3 font-medium', align === 'center' ? 'text-center' : 'text-left')}>
                <button
                    type="button"
                    onClick={() => toggleSort(sortKey)}
                    className={cn(
                        'inline-flex items-center gap-1 hover:text-primary transition-colors',
                        align === 'center' && 'justify-center',
                        active && 'text-primary'
                    )}
                >
                    <span>{children}</span>
                    {active
                        ? (sort.dir === 'asc'
                            ? <ArrowUp className="h-3.5 w-3.5" />
                            : <ArrowDown className="h-3.5 w-3.5" />)
                        : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                </button>
            </th>
        )
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 no-print">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {type === 'students' ? 'Total Students' : 'Total Women'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalStudents || summary.totalWomen}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Overall Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.overallRate}%</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Present</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.totalPresent}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Absent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.totalAbsent}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Individual Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <SortableHeader sortKey="name">Name</SortableHeader>
                                    <SortableHeader sortKey="group">{type === 'students' ? 'Grade' : 'Stage'}</SortableHeader>
                                    <SortableHeader sortKey="total" align="center">Total</SortableHeader>
                                    <th className="text-center p-3 font-medium">Present</th>
                                    <th className="text-center p-3 font-medium">Absent</th>
                                    <th className="text-center p-3 font-medium">Excused</th>
                                    {type === 'students' && <th className="text-center p-3 font-medium">Late</th>}
                                    <SortableHeader sortKey="rate" align="center">Rate</SortableHeader>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedParticipants.map((participant, index) => (
                                    <tr key={participant.student_id || participant.woman_id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                                        <td className="p-3">{participant.name}</td>
                                        <td className="p-3">{participant.grade || participant.stage}</td>
                                        <td className="text-center p-3">{participant.total}</td>
                                        <td className="text-center p-3">
                                            <span className="text-green-600 font-medium">{participant.present}</span>
                                        </td>
                                        <td className="text-center p-3">
                                            <span className="text-red-600 font-medium">{participant.absent}</span>
                                        </td>
                                        <td className="text-center p-3">{participant.excused}</td>
                                        {type === 'students' && <td className="text-center p-3">{participant.late || 0}</td>}
                                        <td className="text-center p-3">
                                            <Badge variant={participant.rate >= 75 ? 'success' : participant.rate >= 50 ? 'secondary' : 'destructive'}>
                                                {participant.rate}%
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
