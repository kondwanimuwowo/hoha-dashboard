import { useStudentAwards } from '@/hooks/useAwards'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/shared/skeletons'
import { Award, Gift, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function StudentAwards({ personId }) {
    const { data: awards, isLoading } = useStudentAwards(personId)

    if (isLoading) return <CardSkeleton lines={5} />

    if (!awards || awards.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Award className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">No awards or resources recorded yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Items given to this student through an award distribution will appear here.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {awards.map((record) => {
                const received = record.received_resources !== false
                return (
                    <Card key={record.id}>
                        <CardContent className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium text-foreground">
                                        {record.award?.award_date ? formatDate(record.award.award_date) : 'Date not set'}
                                    </span>
                                    {record.award?.term && (
                                        <Badge variant="outline" className="text-xs">{record.award.term}</Badge>
                                    )}
                                    {record.award?.academic_year && (
                                        <Badge variant="outline" className="text-xs">{record.award.academic_year}</Badge>
                                    )}
                                </div>
                                <Badge
                                    variant={received ? 'default' : 'secondary'}
                                    className="flex items-center gap-1"
                                >
                                    {received
                                        ? <><CheckCircle2 className="h-3 w-3" /> Resources received</>
                                        : <><XCircle className="h-3 w-3" /> Not received</>}
                                </Badge>
                            </div>

                            {/* Resources given at this distribution */}
                            <div className="mt-4">
                                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Gift className="h-3.5 w-3.5" />
                                    Items given
                                </p>
                                {record.resources && record.resources.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {record.resources.map((name) => (
                                            <Badge key={name} variant="secondary" className="font-normal">
                                                {name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-muted-foreground italic">
                                        No specific items were listed for this distribution.
                                    </p>
                                )}
                            </div>

                            {/* Notes */}
                            {(record.notes || record.award?.notes) && (
                                <div className="mt-4 space-y-1 border-t pt-3 text-sm">
                                    {record.notes && (
                                        <p className="text-foreground">
                                            <span className="font-medium">Note:</span> {record.notes}
                                        </p>
                                    )}
                                    {record.award?.notes && (
                                        <p className="text-muted-foreground">
                                            <span className="font-medium">Distribution note:</span> {record.award.notes}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
