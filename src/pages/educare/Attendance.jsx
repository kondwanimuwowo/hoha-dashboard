import { useState } from 'react'
import { useStudents } from '@/hooks/useStudents'
import { useMarkAttendance, useAttendance } from '@/hooks/useAttendance'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { AttendanceSheet } from '@/components/educare/AttendanceSheet'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { GRADE_LEVELS } from '@/lib/constants'
import { motion } from 'framer-motion'

export function Attendance() {
    const today = new Date().toISOString().split('T')[0]
    const [selectedDate, setSelectedDate] = useState(today)
    const [selectedGrade, setSelectedGrade] = useState('')
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const { data: students, isLoading: studentsLoading } = useStudents({
        gradeLevel: selectedGrade || undefined,
        status: 'Active',
    })

    const { data: existingAttendance, isLoading: attendanceLoading } = useAttendance(
        selectedDate,
        selectedGrade
    )

    const markAttendance = useMarkAttendance()

    const handleSaveAttendance = async (attendanceData) => {
        setError('')
        setSuccess('')
        try {
            await markAttendance.mutateAsync(attendanceData)
            setSuccess(`Attendance saved successfully for ${attendanceData.length} students!`)
            setTimeout(() => setSuccess(''), 5000)
        } catch (err) {
            setError(err.message || 'Failed to save attendance')
        }
    }

    const isLoading = studentsLoading || attendanceLoading

    return (
        <div className="space-y-6">
            <PageHeader
                title="Mark Attendance"
                description="Record daily tuition attendance for students"
            />

            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                <Input
                                    id="date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="pl-9"
                                    max={today}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="grade">Grade Level</Label>
                            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                                <SelectTrigger id="grade">
                                    <SelectValue placeholder="All Grades" />
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

                        <div className="flex items-end">
                            <Button
                                onClick={() => {
                                    setSelectedDate(today)
                                    setSelectedGrade('')
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Sheet */}
            {isLoading ? (
                <LoadingSpinner />
            ) : students && students.length > 0 ? (
                <AttendanceSheet
                    students={students}
                    date={selectedDate}
                    gradeLevel={selectedGrade}
                    existingAttendance={existingAttendance}
                    onSave={handleSaveAttendance}
                />
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="text-neutral-500">
                            {selectedGrade
                                ? `No active students found in ${selectedGrade}`
                                : 'Select a grade level to mark attendance'}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}