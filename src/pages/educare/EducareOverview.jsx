import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStudents } from '@/hooks/useStudents'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, CheckCircle, Clock, UserPlus, ClipboardList } from 'lucide-react'
import { GRADE_LEVELS } from '@/lib/constants'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { StudentForm } from '@/components/educare/StudentForm'
import { useNavigate } from 'react-router-dom'

export function EducareOverview() {
    const navigate = useNavigate()
    const [showAddStudent, setShowAddStudent] = useState(false)
    const { data: students, isLoading } = useStudents()

    if (isLoading) return <LoadingSpinner />

    // Calculate stats
    const totalStudents = students?.length || 0
    const activeStudents = students?.filter(s => s.current_status === 'Active').length || 0
    const earlyChildhood = students?.filter(s =>
        s.grade_level === 'Baby Class' || s.grade_level === 'Reception'
    ).length || 0
    const primarySecondary = totalStudents - earlyChildhood

    // Group by grade level
    const gradeDistribution = GRADE_LEVELS.map(grade => ({
        grade,
        count: students?.filter(s => s.grade_level === grade).length || 0
    }))

    return (
        <div className="space-y-6">
            <PageHeader
                title="Educare Africa"
                description="Education and care program for children from Baby Class to Grade 12"
            />

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Students"
                    value={totalStudents}
                    subtitle="All enrolled"
                    icon={Users}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatsCard
                    title="Active Students"
                    value={activeStudents}
                    subtitle="Currently enrolled"
                    icon={CheckCircle}
                    colorClass="bg-green-50 text-green-600"
                />
                <StatsCard
                    title="Early Childhood"
                    value={earlyChildhood}
                    subtitle="Baby Class & Reception"
                    icon={Users}
                    colorClass="bg-purple-50 text-purple-600"
                />
                <StatsCard
                    title="Primary & Secondary"
                    value={primarySecondary}
                    subtitle="Grade 1-12"
                    icon={Users}
                    colorClass="bg-orange-50 text-orange-600"
                />
            </div>

            {/* Quick Actions */}
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                    className="w-full"
                    onClick={() => navigate('/educare/students')}
                >
                    <Users className="mr-2 h-4 w-4" />
                    View All Students
                </Button>

                <Button
                    className="w-full"
                    onClick={() => navigate('/educare/attendance')}
                >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Mark Attendance
                </Button>

                <Button
                    className="w-full"
                    onClick={() => setShowAddStudent(true)}
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register Student
                </Button>
            </div>

            {/* Add Student Dialog */}
            <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Register New Student</DialogTitle>
                        <div hidden>
                            <DialogDescription>
                                Form to register a new student in the Educare program
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <StudentForm
                        onSuccess={() => {
                            setShowAddStudent(false)
                        }}
                        onCancel={() => setShowAddStudent(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Grade Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Students by Grade Level</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {gradeDistribution.map((item, index) => (
                            <motion.div
                                key={item.grade}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-32 text-sm font-medium text-muted-foreground">
                                        {item.grade}
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-2 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${totalStudents > 0 ? (item.count / totalStudents) * 100 : 0}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                                className="h-full bg-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-4 text-sm font-semibold text-foreground">
                                    {item.count}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

