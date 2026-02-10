import { useState, useEffect, useMemo, useCallback } from 'react'
import { useBeforeUnload } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Check, X, Clock, AlertCircle, Search, Save } from 'lucide-react'
import { ATTENDANCE_STATUS } from '@/lib/constants'
import { calculateAge } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AttendanceSheet({ students, date, gradeLabel, existingAttendance, onSave }) {
    const [attendanceRecords, setAttendanceRecords] = useState({})
    const [initialRecords, setInitialRecords] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isAutoSaving, setIsAutoSaving] = useState(false)
    const [lastSavedAt, setLastSavedAt] = useState(null)

    useEffect(() => {
        const records = {}
        students.forEach((student) => {
            const existing = existingAttendance?.find((a) => a.child_id === student.id)
            records[student.id] = {
                status: existing?.status || '',
                note: existing?.notes || '',
            }
        })
        setAttendanceRecords(records)
        setInitialRecords(records)
    }, [students, existingAttendance])

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(attendanceRecords) !== JSON.stringify(initialRecords),
        [attendanceRecords, initialRecords]
    )

    const isPersisting = isSaving || isAutoSaving

    useBeforeUnload((event) => {
        if (!hasUnsavedChanges || isPersisting) return
        event.preventDefault()
        event.returnValue = 'You have unsaved attendance changes.'
    })

    const markStatus = (studentId, status) => {
        setAttendanceRecords((prev) => {
            const current = prev[studentId] || { status: '', note: '' }
            const nextStatus = current.status === status ? '' : status
            return {
                ...prev,
                [studentId]: { ...current, status: nextStatus },
            }
        })
    }

    const setExcusedNote = (studentId, note) => {
        setAttendanceRecords((prev) => {
            const current = prev[studentId] || { status: '', note: '' }
            return {
                ...prev,
                [studentId]: { ...current, note },
            }
        })
    }

    const markAllPresent = () => {
        const records = {}
        students.forEach((student) => {
            records[student.id] = { status: ATTENDANCE_STATUS.PRESENT, note: '' }
        })
        setAttendanceRecords(records)
    }

    const persistAttendance = useCallback(async (recordsSnapshot, { auto = false } = {}) => {
        if (auto) setIsAutoSaving(true)
        else setIsSaving(true)

        const attendanceData = Object.entries(recordsSnapshot)
            .filter(([, record]) => record?.status)
            .map(([studentId, record]) => ({
                child_id: studentId,
                attendance_date: date,
                status: record.status,
                notes: record.status === ATTENDANCE_STATUS.EXCUSED ? (record.note || null) : null,
                schedule_id: null,
            }))

        try {
            await onSave(attendanceData)
            setInitialRecords(recordsSnapshot)
            setLastSavedAt(new Date())
        } finally {
            if (auto) setIsAutoSaving(false)
            else setIsSaving(false)
        }
    }, [date, onSave])

    const handleSave = async () => {
        await persistAttendance(attendanceRecords, { auto: false })
    }

    useEffect(() => {
        if (!hasUnsavedChanges || isPersisting) return

        const timer = window.setTimeout(() => {
            void persistAttendance(attendanceRecords, { auto: true })
        }, 30000)

        return () => window.clearTimeout(timer)
    }, [attendanceRecords, hasUnsavedChanges, isPersisting, persistAttendance])

    const total = students.length
    const present = Object.values(attendanceRecords).filter(r => r?.status === ATTENDANCE_STATUS.PRESENT).length
    const absent = Object.values(attendanceRecords).filter(r => r?.status === ATTENDANCE_STATUS.ABSENT).length
    const late = Object.values(attendanceRecords).filter(r => r?.status === ATTENDANCE_STATUS.LATE).length
    const excused = Object.values(attendanceRecords).filter(r => r?.status === ATTENDANCE_STATUS.EXCUSED).length
    const unmarked = total - (present + absent + late + excused)

    const filteredStudents = students.filter((student) => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase())
    })

    return (
        <div className="space-y-4">
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
                            <Button onClick={handleSave} disabled={isPersisting} size="sm">
                                <Save className="mr-2 h-4 w-4" />
                                {isPersisting ? 'Saving...' : 'Save Attendance'}
                            </Button>
                        </div>
                    </div>
                    {(hasUnsavedChanges || isAutoSaving || lastSavedAt) && (
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            {isAutoSaving
                                ? 'Autosaving attendance...'
                                : hasUnsavedChanges
                                    ? 'You have unsaved changes. Autosave runs every 30 seconds.'
                                    : `Last saved at ${lastSavedAt?.toLocaleTimeString()}`}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''}
                        {gradeLabel && ` - ${gradeLabel}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-neutral-100">
                        <AnimatePresence>
                            {filteredStudents.map((student, index) => {
                                const record = attendanceRecords[student.id] || { status: '', note: '' }
                                const status = record.status
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
                                                <PersonAvatar
                                                    photoUrl={student.photo_url}
                                                    gender={student.gender}
                                                    firstName={student.first_name}
                                                    lastName={student.last_name}
                                                    className="h-12 w-12"
                                                />

                                                <div className="flex-1">
                                                    <div className="font-semibold text-neutral-900">
                                                        {student.first_name} {student.last_name}
                                                    </div>
                                                    <div className="text-sm text-neutral-600 flex items-center space-x-2">
                                                        <span>{student.grade_level}</span>
                                                        {age && (
                                                            <>
                                                                <span>&bull;</span>
                                                                <span>{age} years</span>
                                                            </>
                                                        )}
                                                        {student.phone_number && (
                                                            <>
                                                                <span>&bull;</span>
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

                                        {status === ATTENDANCE_STATUS.EXCUSED && (
                                            <div className="mt-3 max-w-md">
                                                <Input
                                                    value={record.note || ''}
                                                    onChange={(e) => setExcusedNote(student.id, e.target.value)}
                                                    placeholder="Reason for excused absence..."
                                                />
                                            </div>
                                        )}
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
