import { motion } from 'framer-motion'
import { useState } from 'react'
import { useWomen } from '@/hooks/useWomen'
import { useMarkLegacyAttendance, useLegacyAttendance, useMonthlyLegacyAttendanceReport, useTermlyLegacyAttendanceReport } from '@/hooks/useLegacyAttendance'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { LegacyAttendanceSheet } from '@/components/legacy/LegacyAttendanceSheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'
import { LEGACY_STAGES, SESSION_TYPES } from '@/lib/constants'
import { AttendanceReportTable } from '@/components/shared/AttendanceReportTable'

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

export function LegacyAttendance() {
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const [viewMode, setViewMode] = useState('daily')
    const [selectedDate, setSelectedDate] = useState(today)
    const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString().padStart(2, '0'))
    const [selectedYear, setSelectedYear] = useState(currentYear.toString())
    const [selectedTerm, setSelectedTerm] = useState('1')
    const [selectedStage, setSelectedStage] = useState('')
    const [selectedSessionType, setSelectedSessionType] = useState('')
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const { data: women, isLoading: womenLoading } = useWomen({
        stage: selectedStage || undefined,
        status: 'Active',
    })

    const { data: existingAttendance, isLoading: attendanceLoading } = useLegacyAttendance(
        selectedDate,
        selectedSessionType
    )

    const { data: monthlyReport, isLoading: monthlyLoading } = useMonthlyLegacyAttendanceReport(
        selectedMonth,
        selectedYear,
        selectedStage
    )

    const { data: termlyReport, isLoading: termlyLoading } = useTermlyLegacyAttendanceReport(
        selectedTerm,
        selectedYear,
        selectedStage
    )

    const markAttendance = useMarkLegacyAttendance()

    const handleSaveAttendance = async (attendanceData) => {
        setError('')
        setSuccess('')
        try {
            await markAttendance.mutateAsync(attendanceData)
            setSuccess(`Attendance saved successfully for ${attendanceData.length} women!`)
            setTimeout(() => setSuccess(''), 5000)
        } catch (err) {
            setError(err.message || 'Failed to save attendance')
        }
    }

    const isLoading = womenLoading || attendanceLoading || monthlyLoading || termlyLoading

    return (
        <div className="space-y-6">
            <PageHeader
                title="Legacy Women Attendance"
                description="Record and view attendance for Legacy Women's Program"
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
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    <Label htmlFor="sessionType">Session Type</Label>
                                    <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                                        <SelectTrigger id="sessionType">
                                            <SelectValue placeholder="All Sessions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sessions</SelectItem>
                                            {SESSION_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="stage">Stage</Label>
                                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                                        <SelectTrigger id="stage">
                                            <SelectValue placeholder="All Stages" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Stages</SelectItem>
                                            {LEGACY_STAGES.map((stage) => (
                                                <SelectItem key={stage} value={stage}>
                                                    {stage}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        onClick={() => {
                                            setSelectedDate(today)
                                            setSelectedStage('')
                                            setSelectedSessionType('')
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

                    {isLoading ? (
                        <LoadingSpinner />
                    ) : women && women.length > 0 && selectedSessionType && selectedSessionType !== 'all' ? (
                        <LegacyAttendanceSheet
                            women={women}
                            date={selectedDate}
                            sessionType={selectedSessionType}
                            stage={selectedStage}
                            existingAttendance={existingAttendance}
                            onSave={handleSaveAttendance}
                        />
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="text-neutral-500">
                                    {!selectedSessionType || selectedSessionType === 'all'
                                        ? 'Please select a session type to mark attendance'
                                        : selectedStage
                                            ? `No active women found in ${selectedStage}`
                                            : 'No active women found'}
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
                                    <Label>Stage</Label>
                                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Stages" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Stages</SelectItem>
                                            {LEGACY_STAGES.map((stage) => (
                                                <SelectItem key={stage} value={stage}>
                                                    {stage}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <AttendanceReportTable
                                data={monthlyReport}
                                isLoading={monthlyLoading}
                                type="women"
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
                                    <Label>Stage</Label>
                                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Stages" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Stages</SelectItem>
                                            {LEGACY_STAGES.map((stage) => (
                                                <SelectItem key={stage} value={stage}>
                                                    {stage}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <AttendanceReportTable
                                data={termlyReport}
                                isLoading={termlyLoading}
                                type="women"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

