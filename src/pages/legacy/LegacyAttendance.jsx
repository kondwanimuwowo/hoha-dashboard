import { useState } from 'react'
import { useWomen } from '@/hooks/useWomen'
import { useMarkLegacyAttendance, useLegacyAttendance } from '@/hooks/useLegacyAttendance'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { LegacyAttendanceSheet } from '@/components/legacy/LegacyAttendanceSheet'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { LEGACY_STAGES, SESSION_TYPES } from '@/lib/constants'
import { motion } from 'framer-motion'

export function LegacyAttendance() {
    const today = new Date().toISOString().split('T')[0]
    const [selectedDate, setSelectedDate] = useState(today)
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

    const isLoading = womenLoading || attendanceLoading

    return (
        <div className="space-y-6">
            <PageHeader
                title="Mark Attendance"
                description="Record session attendance for Legacy Women's Program"
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

            {/* Attendance Sheet */}
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
        </div>
    )
}
