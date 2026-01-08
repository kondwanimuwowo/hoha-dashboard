import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, X, Clock, AlertCircle, Search, Save } from 'lucide-react'
import { ATTENDANCE_STATUS } from '@/lib/constants'
import { calculateAge } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AttendanceSheet({ students, date, gradeLevel, existingAttendance, onSave }) {
    const [attendanceRecords, setAttendanceRecords] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Initialize attendance records
    useEffect(() => {
        const records = {}
        students.forEach((student) => {
            const existing = existingAttendance?.find((a) => a.child_id === student.id)
            records[student.id] = existing?.status || ''
        })
        setAttendanceRecords(records)
    }, [students, existingAttendance])

    const markStatus = (studentId, status) => {
        setAttendanceRecords((prev) => ({
            ...prev,
            [studentId]: prev[studentId] === status ? '' : status,
        }))
    }

    const markAllPresent = () => {
        const records = {}
        students.forEach((student) => {
            records[student.id] = ATTENDANCE_STATUS.PRESENT
        })
        setAttendanceRecords(records)
    }

    const handleSave = async () => {
        setIsSaving(true)

        // Convert to array format expected by the API
        const attendanceData = Object.entries(attendanceRecords)
            .filter(([_, status]) => status) // Only include students with a status
            .map(([studentId, status]) => ({
                child_id: studentId,
                attendance_date: date,
                status: status,
                schedule_id: null, // We'll handle schedule logic later
            }))

        try {
            await onSave(attendanceData)
        } finally {
            setIsSaving(false)
        }
    }

    // Calculate statistics
    const total = students.length
    const present = Object.values(attendanceRecords).filter(s => s === ATTENDANCE_STATUS.PRESENT).length
    const absent = Object.values(attendanceRecords).filter(s => s === ATTENDANCE_STATUS.ABSENT).length
    const late = Object.values(attendanceRecords).filter(s => s === ATTENDANCE_STATUS.LATE).length
    const excused = Object.values(attendanceRecords).filter(s => s === ATTENDANCE_STATUS.EXCUSED).length
    const unmarked = total - (present + absent + late + excused)

    // Filter students by search
    const filteredStudents = students.filter((student) => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase())
    })

    return (
        <div className="space-y-4">
            {/* Stats & Actions Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="font-semibold text-green-600">{present}</span>
                                <span className="text-neutral-600">Present</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <X className="h-4 w-4 text-red-600" />
                                </div>
                                <span className="font-semibold text-red-600">{absent}</span>
                                <span className="text-neutral-600">Absent</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                </div>
                                <span className="font-semibold text-orange-600">{late}</span>
                                <span className="text-neutral-600">Late</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-semibold text-blue-600">{excused}</span>
                                <span className="text-neutral-600">Excused</span>
                            </div>
                            {unmarked > 0 && (
                                <div className="flex items-center space-x-2">
                                    <Badge variant="secondary">{unmarked} Unmarked</Badge>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button onClick={markAllPresent} variant="outline" size="sm">
                                Mark All Present
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} size="sm">
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? 'Saving...' : 'Save Attendance'}
                            </Button>
                        </div>
                    </div>
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

            {/* Student List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''}
                        {gradeLevel && ` - ${gradeLevel}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-neutral-100">
                        <AnimatePresence>
                            {filteredStudents.map((student, index) => {
                                const status = attendanceRecords[student.id]
                                const age = calculateAge(student.date_of_birth)

                                return (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2, delay: index * 0.02 }}
                                        className="p-4 hover:bg-neutral-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 flex-1">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={student.photo_url} />
                                                    <AvatarFallback>
                                                        {student.first_name?.charAt(0)}
                                                        {student.last_name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1">
                                                    <div className="font-semibold text-neutral-900">
                                                        {student.first_name} {student.last_name}
                                                    </div>
                                                    <div className="text-sm text-neutral-600 flex items-center space-x-2">
                                                        <span>{student.grade_level}</span>
                                                        {age && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{age} years</span>
                                                            </>
                                                        )}
                                                        {student.phone_number && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{student.phone_number}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant={status === ATTENDANCE_STATUS.PRESENT ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => markStatus(student.id, ATTENDANCE_STATUS.PRESENT)}
                                                    className={cn(
                                                        status === ATTENDANCE_STATUS.PRESENT && 'bg-green-600 hover:bg-green-700'
                                                    )}
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Present
                                                </Button>

                                                <Button
                                                    variant={status === ATTENDANCE_STATUS.ABSENT ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => markStatus(student.id, ATTENDANCE_STATUS.ABSENT)}
                                                    className={cn(
                                                        status === ATTENDANCE_STATUS.ABSENT && 'bg-red-600 hover:bg-red-700'
                                                    )}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Absent
                                                </Button>

                                                <Button
                                                    variant={status === ATTENDANCE_STATUS.LATE ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => markStatus(student.id, ATTENDANCE_STATUS.LATE)}
                                                    className={cn(
                                                        status === ATTENDANCE_STATUS.LATE && 'bg-orange-600 hover:bg-orange-700'
                                                    )}
                                                >
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    Late
                                                </Button>

                                                <Button
                                                    variant={status === ATTENDANCE_STATUS.EXCUSED ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => markStatus(student.id, ATTENDANCE_STATUS.EXCUSED)}
                                                    className={cn(
                                                        status === ATTENDANCE_STATUS.EXCUSED && 'bg-blue-600 hover:bg-blue-700'
                                                    )}
                                                >
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                    Excused
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}