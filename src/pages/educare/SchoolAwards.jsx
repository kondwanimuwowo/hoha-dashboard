import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudentRankings } from '@/hooks/useAwards'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { RegistrationFilter } from '@/components/shared/RegistrationFilter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Trophy, Plus, Award, TrendingUp } from 'lucide-react'
import { AwardForm } from '@/components/educare/AwardForm'

const GRADE_LEVELS = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

export function SchoolAwards() {
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const [gradeFilter, setGradeFilter] = useState('all')
    const [registrationFilter, setRegistrationFilter] = useState('all')
    const [sortBy, setSortBy] = useState('attendance') // attendance, grade, name, awards

    const { data: rankings, isLoading } = useStudentRankings({
        gradeLevel: gradeFilter !== 'all' ? gradeFilter : undefined,
        registrationStatus: registrationFilter,
    })

    if (isLoading) return <LoadingSpinner />

    // Sort rankings
    const sortedRankings = rankings ? [...rankings].sort((a, b) => {
        switch (sortBy) {
            case 'attendance':
                return b.attendance_percentage - a.attendance_percentage
            case 'grade':
                return a.grade_level.localeCompare(b.grade_level)
            case 'name':
                return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
            case 'awards':
                return b.total_awards_received - a.total_awards_received
            default:
                return 0
        }
    }) : []

    return (
        <div className="space-y-6">
            <PageHeader
                title="School Items & Awards"
                description="Track and reward top-performing students based on attendance"
            />

            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Grade Level</Label>
                        <Select value={gradeFilter} onValueChange={setGradeFilter}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grades</SelectItem>
                                {GRADE_LEVELS.map((grade) => (
                                    <SelectItem key={grade} value={grade}>
                                        {grade}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <RegistrationFilter
                        value={registrationFilter}
                        onChange={setRegistrationFilter}
                    />

                    <div className="space-y-2">
                        <Label>Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="attendance">Attendance %</SelectItem>
                                <SelectItem value="grade">Grade Level</SelectItem>
                                <SelectItem value="name">Name (A-Z)</SelectItem>
                                <SelectItem value="awards">Total Awards</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Award Distribution
                </Button>
            </div>

            {/* Top Performers List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        Student Rankings ({sortedRankings.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {sortedRankings.length > 0 ? (
                        <div className="space-y-2">
                            {sortedRankings.map((student, index) => (
                                <div
                                    key={student.student_id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                    onClick={() => navigate(`/educare/students/${student.student_id}`)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Rank Badge */}
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-muted text-muted-foreground'
                                            }`}>
                                            {index + 1}
                                        </div>

                                        {/* Student Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">
                                                    {student.first_name} {student.last_name}
                                                </p>
                                                <Badge variant="outline" className="text-xs">
                                                    {student.grade_level}
                                                </Badge>
                                                <Badge variant={student.is_registered_member ? 'default' : 'secondary'} className="text-xs">
                                                    {student.is_registered_member ? 'Registered' : 'Non-Registered'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span>
                                                    {student.total_present}/{student.total_sessions} sessions
                                                </span>
                                                {student.total_awards_received > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Award className="h-3 w-3" />
                                                        {student.total_awards_received} award{student.total_awards_received !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Attendance Percentage */}
                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                <div className="w-32 bg-muted rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${student.attendance_percentage >= 90 ? 'bg-green-500' :
                                                                student.attendance_percentage >= 75 ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                            }`}
                                                        style={{ width: `${student.attendance_percentage}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-lg min-w-[4rem] text-right">
                                                    {student.attendance_percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                            {student.grade_rank && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    #{student.grade_rank} in grade
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                No students found with the selected filters
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Award Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record Award Distribution</DialogTitle>
                        <DialogDescription>
                            Select students to receive awards based on their attendance performance
                        </DialogDescription>
                    </DialogHeader>
                    <AwardForm
                        onSuccess={() => setShowCreate(false)}
                        onCancel={() => setShowCreate(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
