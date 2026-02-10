import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useStudents } from '@/hooks/useStudents'
import { useMarkAttendance, useAttendance, useMonthlyAttendanceReport, useTermlyAttendanceReport } from '@/hooks/useAttendance'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { AttendanceSheet } from '@/components/educare/AttendanceSheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'
import { GRADE_LEVELS } from '@/lib/constants'
import { AttendanceReportTable } from '@/components/shared/AttendanceReportTable'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const MONTHS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
]

const TERMS = [
    { value: '1', label: 'Term 1 (Jan-Apr)' },
    { value: '2', label: 'Term 2 (May-Aug)' },
    { value: '3', label: 'Term 3 (Sep-Dec)' },
]

export function Attendance() {
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const persistedFilters = (() => {
        if (typeof window === 'undefined') {
            return null
        }
        try {
            const raw = window.localStorage.getItem('educare-attendance-filters-v1')
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    })()

    const [viewMode, setViewMode] = useState('daily') // 'daily', 'monthly', 'termly'
    const [selectedDate, setSelectedDate] = useState(persistedFilters?.selectedDate || today)
    const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString().padStart(2, '0'))
    const [selectedYear, setSelectedYear] = useState(currentYear.toString())
    const [selectedTerm, setSelectedTerm] = useState('1')
    const [selectedGrades, setSelectedGrades] = useState(
        Array.isArray(persistedFilters?.selectedGrades) ? persistedFilters.selectedGrades : []
    )
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        localStorage.setItem(
            'educare-attendance-filters-v1',
            JSON.stringify({ selectedDate, selectedGrades })
        )
    }, [selectedDate, selectedGrades])

    const selectedGradeLabel = useMemo(() => {
        if (selectedGrades.length === 0) return 'All Grades'
        if (selectedGrades.length === 1) return selectedGrades[0]
        return `${selectedGrades.length} grades selected`
    }, [selectedGrades])

    const setAllGrades = (checked) => {
        setSelectedGrades(checked ? [...GRADE_LEVELS] : [])
    }

    const renderGradeFilter = (id) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button id={id} variant="outline" className="w-full justify-start">
                    {selectedGradeLabel}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Select One or More Grades</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={selectedGrades.length === GRADE_LEVELS.length}
                    onCheckedChange={setAllGrades}
                    onSelect={(event) => event.preventDefault()}
                >
                    All Grades
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {GRADE_LEVELS.map((grade) => (
                    <DropdownMenuCheckboxItem
                        key={grade}
                        checked={selectedGrades.includes(grade)}
                        onCheckedChange={(checked) => {
                            if (checked) {
                                setSelectedGrades((prev) => (
                                    prev.includes(grade) ? prev : [...prev, grade]
                                ))
                            } else {
                                setSelectedGrades((prev) => prev.filter((g) => g !== grade))
                            }
                        }}
                        onSelect={(event) => event.preventDefault()}
                    >
                        {grade}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )

    const { data: students, isLoading: studentsLoading } = useStudents({
        gradeLevels: selectedGrades.length > 0 ? selectedGrades : undefined,
        status: 'Active',
    })

    const { data: existingAttendance, isLoading: attendanceLoading } = useAttendance(
        selectedDate,
        selectedGrades
    )

    const { data: monthlyReport, isLoading: monthlyLoading } = useMonthlyAttendanceReport(
        selectedMonth,
        selectedYear,
        selectedGrades
    )

    const { data: termlyReport, isLoading: termlyLoading } = useTermlyAttendanceReport(
        selectedTerm,
        selectedYear,
        selectedGrades
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
                title="Educare Attendance"
                description="Record and view attendance for students"
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

            <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
                    <TabsTrigger value="termly">Termly Report</TabsTrigger>
                </TabsList>

                {/* Daily Attendance Tab */}
                <TabsContent value="daily" className="space-y-6">
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
                                    {renderGradeFilter('grade')}
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        onClick={() => {
                                            setSelectedDate(today)
                                            setSelectedGrades([])
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
                            gradeLabel={selectedGradeLabel}
                            existingAttendance={existingAttendance}
                            onSave={handleSaveAttendance}
                        />
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="text-neutral-500">
                                    {selectedGrades.length > 0
                                        ? `No active students found for selected grades (${selectedGrades.join(', ')})`
                                        : 'No active students found'}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Monthly Report Tab */}
                <TabsContent value="monthly" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Attendance Report</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="space-y-2">
                                    <Label>Month</Label>
                                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map((month) => (
                                                <SelectItem key={month.value} value={month.value}>
                                                    {month.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Year</Label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Grade Level</Label>
                                    {renderGradeFilter('monthly-grade')}
                                </div>
                            </div>

                            <AttendanceReportTable
                                data={monthlyReport}
                                isLoading={monthlyLoading}
                                type="students"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Termly Report Tab */}
                <TabsContent value="termly" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Termly Attendance Report</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="space-y-2">
                                    <Label>Term</Label>
                                    <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TERMS.map((term) => (
                                                <SelectItem key={term.value} value={term.value}>
                                                    {term.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Year</Label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Grade Level</Label>
                                    {renderGradeFilter('termly-grade')}
                                </div>
                            </div>

                            <AttendanceReportTable
                                data={termlyReport}
                                isLoading={termlyLoading}
                                type="students"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

