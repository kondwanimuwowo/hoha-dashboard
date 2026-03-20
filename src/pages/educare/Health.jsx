import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStudents } from '@/hooks/useStudents'
import {
    useDewormingEvents,
    useDewormingEvent,
    useCreateDewormingEvent,
    useDeleteDewormingEvent,
    useSaveDewormingRecords,
} from '@/hooks/useDeworming'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { HealthTable } from '@/components/educare/HealthTable'
import { DewormingEventForm } from '@/components/educare/DewormingEventForm'
import { DewormingRecordSheet } from '@/components/educare/DewormingRecordSheet'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Pill, Calendar, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import { GRADE_LEVELS } from '@/lib/constants'
import { toast } from 'sonner'

export function Health() {
    const navigate = useNavigate()
    const [selectedEventId, setSelectedEventId] = useState(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [gradeFilter, setGradeFilter] = useState('all')

    // Data
    const { data: students, isLoading: studentsLoading } = useStudents({ status: 'Active' })
    const { data: events, isLoading: eventsLoading } = useDewormingEvents()
    const { data: eventDetail, isLoading: eventDetailLoading } = useDewormingEvent(selectedEventId)

    // Mutations
    const createEvent = useCreateDewormingEvent()
    const deleteEvent = useDeleteDewormingEvent()
    const saveRecords = useSaveDewormingRecords()

    const handleCreateEvent = async (data) => {
        try {
            const event = await createEvent.mutateAsync(data)
            setShowCreateForm(false)
            setSelectedEventId(event.id)
            toast.success('Deworming event created. All active students have been added.')
        } catch (err) {
            toast.error(err.message || 'Failed to create event')
        }
    }

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Delete this deworming event and all its records? This cannot be undone.')) return
        try {
            await deleteEvent.mutateAsync(eventId)
            if (selectedEventId === eventId) setSelectedEventId(null)
            toast.success('Deworming event deleted')
        } catch (err) {
            toast.error(err.message || 'Failed to delete event')
        }
    }

    const handleSaveRecords = useCallback(async (records) => {
        try {
            await saveRecords.mutateAsync({
                eventId: selectedEventId,
                eventDate: eventDetail.event_date,
                records,
            })
            toast.success('Records saved successfully')
        } catch (err) {
            toast.error(err.message || 'Failed to save records')
        }
    }, [saveRecords, selectedEventId, eventDetail?.event_date])

    // Filter records by grade if in recording mode
    const filteredRecords = eventDetail?.records?.filter((r) => {
        if (gradeFilter === 'all') return true
        return r.grade_level === gradeFilter
    })

    // ── Recording Mode ──
    if (selectedEventId) {
        if (eventDetailLoading) return <LoadingSpinner />

        return (
            <div className="space-y-6">
                {/* Back button */}
                <Button
                    variant="ghost"
                    onClick={() => setSelectedEventId(null)}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Health Overview
                </Button>

                {/* Event banner */}
                {eventDetail && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-primary-200 bg-primary-50/50">
                            <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                            <Pill className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold">{eventDetail.medication_name}</h2>
                                            <div className="text-sm text-muted-foreground flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(eventDetail.event_date).toLocaleDateString()}
                                                </span>
                                                <span>
                                                    {eventDetail.dosage_amount} {eventDetail.dosage_unit}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Filter by Grade</Label>
                                            <Select value={gradeFilter} onValueChange={setGradeFilter}>
                                                <SelectTrigger className="w-48">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Grades</SelectItem>
                                                    {GRADE_LEVELS.map((g) => (
                                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                {eventDetail.notes && (
                                    <p className="mt-2 text-sm text-muted-foreground">{eventDetail.notes}</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Recording sheet */}
                <DewormingRecordSheet
                    records={filteredRecords || []}
                    event={eventDetail}
                    onSave={handleSaveRecords}
                    isSaving={saveRecords.isPending}
                />
            </div>
        )
    }

    // ── Overview Mode ──
    const isLoading = studentsLoading || eventsLoading

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Health & Deworming"
                description="Track student health measurements and deworming events"
                action={() => setShowCreateForm(true)}
                actionLabel="Record Deworming Event"
                actionIcon={Plus}
            />

            {/* Health overview table */}
            <HealthTable students={students || []} onRowClick={(student) => navigate(`/educare/students/${student.person_id}`)} />

            {/* Past events */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Deworming Events</h2>

                {events && events.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Card
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => setSelectedEventId(event.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Pill className="h-4 w-4 text-primary-600" />
                                                <span className="font-semibold">{event.medication_name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-neutral-400 hover:text-red-600"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteEvent(event.id)
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(event.event_date).toLocaleDateString()}
                                            </div>
                                            <div>
                                                Dosage: {event.dosage_amount} {event.dosage_unit}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <Badge variant={event.administered_count === event.total_records ? 'default' : 'secondary'}>
                                                {event.administered_count === event.total_records ? (
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                )}
                                                {event.administered_count}/{event.total_records} administered
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center text-neutral-500">
                            No deworming events recorded yet. Click "Record Deworming Event" to get started.
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Create event dialog */}
            <DewormingEventForm
                open={showCreateForm}
                onOpenChange={setShowCreateForm}
                onSubmit={handleCreateEvent}
                isSubmitting={createEvent.isPending}
            />

        </div>
    )
}
