import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function AttendanceReportTable({ data, isLoading, type = 'students' }) {
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

    const participants = type === 'students' ? data.students : data.women
    const summary = data.summary

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
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
                                    <th className="text-left p-3 font-medium">Name</th>
                                    <th className="text-left p-3 font-medium">{type === 'students' ? 'Grade' : 'Stage'}</th>
                                    <th className="text-center p-3 font-medium">Total</th>
                                    <th className="text-center p-3 font-medium">Present</th>
                                    <th className="text-center p-3 font-medium">Absent</th>
                                    <th className="text-center p-3 font-medium">Excused</th>
                                    {type === 'students' && <th className="text-center p-3 font-medium">Late</th>}
                                    <th className="text-center p-3 font-medium">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((participant, index) => (
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
