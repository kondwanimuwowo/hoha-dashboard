import { useState } from 'react'
import { useStudentDewormingHistory } from '@/hooks/useDeworming'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

function Change({ current, previous, unit }) {
    if (current == null || previous == null) return null
    const diff = Number(current) - Number(previous)
    if (!Number.isFinite(diff) || diff === 0) return null
    return (
        <span className={cn('ml-1.5 text-xs', diff > 0 ? 'text-green-600' : 'text-red-600')}>
            {diff > 0 ? '+' : ''}{Number(diff.toFixed(1))} {unit}
        </span>
    )
}

const RECENT_COUNT = 5

export function DewormingHistory({ childId }) {
    const { data, isLoading } = useStudentDewormingHistory(childId)
    const [showAll, setShowAll] = useState(false)

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading history...</p>
    }

    // Every event creates a row for every active student; skip the ones where nothing was recorded.
    const history = (data || []).filter((r) => r.administered || r.weight_kg != null || r.height_cm != null)

    if (history.length === 0) {
        return <p className="text-sm text-muted-foreground">No deworming or measurements recorded for this student yet.</p>
    }

    const visible = showAll ? history : history.slice(0, RECENT_COUNT)

    // Records are newest first; compare each against the next older one that has a value.
    const previousValue = (index, field) => {
        for (let i = index + 1; i < history.length; i++) {
            if (history[i][field] != null) return history[i][field]
        }
        return null
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-muted-foreground">
                        <th className="p-2 font-medium">Date</th>
                        <th className="p-2 font-medium">Medication</th>
                        <th className="p-2 font-medium">Weight</th>
                        <th className="p-2 font-medium">Height</th>
                        <th className="p-2 font-medium">Deworming</th>
                    </tr>
                </thead>
                <tbody>
                    {visible.map((record, index) => (
                        <tr key={record.id} className="border-b last:border-b-0">
                            <td className="p-2 whitespace-nowrap">{formatDate(record.event.event_date)}</td>
                            <td className="p-2">
                                {record.event.medication_name}
                                <span className="ml-1 text-muted-foreground">
                                    ({record.event.dosage_amount} {record.event.dosage_unit})
                                </span>
                            </td>
                            <td className="p-2 whitespace-nowrap">
                                {record.weight_kg != null ? `${record.weight_kg} kg` : '—'}
                                <Change current={record.weight_kg} previous={previousValue(index, 'weight_kg')} unit="kg" />
                            </td>
                            <td className="p-2 whitespace-nowrap">
                                {record.height_cm != null ? `${record.height_cm} cm` : '—'}
                                <Change current={record.height_cm} previous={previousValue(index, 'height_cm')} unit="cm" />
                            </td>
                            <td className="p-2">
                                <Badge variant={record.administered ? 'success' : 'secondary'}>
                                    {record.administered ? 'Given' : 'Not given'}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {history.length > RECENT_COUNT && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? 'Show recent only' : `Show all ${history.length} records`}
                </Button>
            )}
        </div>
    )
}
