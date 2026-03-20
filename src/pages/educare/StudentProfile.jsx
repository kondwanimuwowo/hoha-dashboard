import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useStudent, useDeleteStudent } from '@/hooks/useStudents'
import { useAttendanceSummary } from '@/hooks/useAttendance'
import { useStudentGuardians } from '@/hooks/useRelationships'
import { useStudentDocuments } from '@/hooks/useRecords'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft, Edit, Phone, MapPin, Calendar, School, Users as UsersIcon,
    Trash2, Printer, FileText, Heart, Weight, Ruler, Pill,
    AlertTriangle, ChevronRight, ShieldCheck, Clock
} from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StudentForm } from '@/components/educare/StudentForm'
import { ParentDetailCard } from '@/components/educare/ParentDetailCard'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CaseNotes } from '@/components/records/CaseNotes'
import { StudentDocuments } from '@/components/records/StudentDocuments'

function InfoRow({ icon: Icon, label, value, iconClass }) {
    return (
        <div className="flex items-start gap-3 py-2">
            <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconClass || 'bg-neutral-100 text-neutral-500')}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-medium text-foreground">{value || 'Not provided'}</p>
            </div>
        </div>
    )
}

function MetricTile({ icon: Icon, label, value, unit, accent, empty }) {
    return (
        <div className={cn(
            'relative overflow-hidden rounded-xl border p-4 transition-colors',
            empty ? 'border-dashed border-neutral-300 bg-neutral-50/50' : 'bg-card'
        )}>
            {!empty && (
                <div className={cn('absolute top-0 left-0 h-1 w-full', accent || 'bg-primary-400')} />
            )}
            <div className="flex items-center gap-3">
                <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    empty ? 'bg-neutral-100 text-neutral-400' : `${accent?.replace('bg-', 'bg-')?.replace('-400', '-100')?.replace('-500', '-100') || 'bg-primary-100'} text-${accent?.replace('bg-', '')?.replace('-400', '-600')?.replace('-500', '-600') || 'primary-600'}`
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    {empty ? (
                        <p className="text-sm text-muted-foreground italic">Not recorded</p>
                    ) : (
                        <p className="text-2xl font-bold tracking-tight text-foreground">
                            {value}<span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
                        </p>
                    )}
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                </div>
            </div>
        </div>
    )
}

function getDewormingStatus(lastDate) {
    if (!lastDate) return { label: 'Never', variant: 'destructive', overdue: true }
    const last = new Date(lastDate)
    const now = new Date()
    const months = (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth())
    if (months < 6) return { label: 'Up to date', variant: 'success', overdue: false }
    return { label: 'Due', variant: 'secondary', overdue: true }
}

export function StudentProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: student, isLoading, isError } = useStudent(id)
    const { data: relationships } = useStudentGuardians(student?.id)
    const deleteStudent = useDeleteStudent()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const { data: attendanceData } = useAttendanceSummary(
        student?.id,
        startDate.toISOString(),
        new Date().toISOString()
    )

    const { data: documents } = useStudentDocuments(id)
    const reportCardsCount = documents?.filter(d => d.document_type === 'Report Card').length ?? 0

    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedParentForDetail, setSelectedParentForDetail] = useState(null)

    if (isLoading) return <LoadingSpinner />
    if (isError || !student) return <div>Student not found</div>

    const enrollment = student.educare_enrollment?.[0]
    const age = calculateAge(student.date_of_birth)
    const dewormingStatus = getDewormingStatus(enrollment?.last_deworming_date)

    const handleDelete = async () => {
        try {
            await deleteStudent.mutateAsync(id)
            toast.success('Student record deleted successfully')
            navigate('/educare/students')
        } catch (error) {
            toast.error('Failed to delete student: ' + error.message)
        }
    }

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Active': return 'success'
            case 'Graduated': return 'default'
            case 'Withdrawn': return 'destructive'
            case 'Transferred': return 'secondary'
            default: return 'secondary'
        }
    }

    // Resolve emergency contact
    const linkedEmergency = relationships?.find(r => r.is_emergency_contact && r.person)
    const emergencyName = linkedEmergency
        ? [linkedEmergency.person?.first_name, linkedEmergency.person?.last_name].filter(Boolean).join(' ')
        : student.emergency_contact_name
    const emergencyPhone = linkedEmergency ? linkedEmergency.person?.phone_number : student.emergency_contact_phone
    const emergencyRel = linkedEmergency ? linkedEmergency.relationship_type : student.emergency_contact_relationship

    return (
        <div className="space-y-6">
            {/* Top bar */}
            <div className="flex items-center justify-between no-print">
                <Button variant="ghost" onClick={() => navigate('/educare/students')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Students
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </div>

            {/* ── Hero Header ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <PersonAvatar
                                    photoUrl={student.photo_url}
                                    gender={student.gender}
                                    firstName={student.first_name}
                                    lastName={student.last_name}
                                    className="h-20 w-20 border-2 border-primary-100 shadow-sm"
                                />
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                        {student.first_name} {student.last_name}
                                    </h1>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                        {age != null && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {age} years old
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <School className="h-3.5 w-3.5" />
                                            {enrollment?.grade_level || 'No Grade'}
                                        </span>
                                        {enrollment?.government_school?.school_name && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {enrollment.government_school.school_name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-2">
                                        <Badge variant={getStatusVariant(enrollment?.current_status)}>
                                            {enrollment?.current_status || 'Unknown'}
                                        </Badge>
                                        {student.is_registered_member && (
                                            <Badge variant="outline" className="gap-1 border-primary-200 text-primary-700">
                                                <ShieldCheck className="h-3 w-3" />
                                                Registered
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 no-print shrink-0">
                                <Button onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => setIsDeleting(true)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Delete Confirmation */}
            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This will mark the student record as deleted. You can restore it later if needed by contacting the administrator.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleting(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteStudent.isPending}>
                            {deleteStudent.isPending ? 'Deleting...' : 'Confirm Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Student</DialogTitle>
                        <DialogDescription>
                            Update the student's personal and enrollment information.
                        </DialogDescription>
                    </DialogHeader>
                    {student && (
                        <StudentForm
                            initialData={{ ...student, relationships }}
                            onSuccess={() => setIsEditing(false)}
                            onCancel={() => setIsEditing(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="case-notes">Case Notes</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">

                    {/* ── Health & Vitals ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Heart className="h-5 w-5 text-rose-500" />
                                        Health & Vitals
                                    </CardTitle>
                                    {dewormingStatus.overdue && (
                                        <Badge variant={dewormingStatus.variant} className="gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Deworming {dewormingStatus.label === 'Never' ? 'never done' : 'due'}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <MetricTile
                                        icon={Weight}
                                        label="Weight"
                                        value={enrollment?.weight_kg}
                                        unit="kg"
                                        accent="bg-blue-400"
                                        empty={!enrollment?.weight_kg}
                                    />
                                    <MetricTile
                                        icon={Ruler}
                                        label="Height"
                                        value={enrollment?.height_cm}
                                        unit="cm"
                                        accent="bg-emerald-400"
                                        empty={!enrollment?.height_cm}
                                    />
                                    <div className={cn(
                                        'relative overflow-hidden rounded-xl border p-4 transition-colors',
                                        !enrollment?.last_deworming_date ? 'border-dashed border-neutral-300 bg-neutral-50/50' : 'bg-card'
                                    )}>
                                        {enrollment?.last_deworming_date && (
                                            <div className="absolute top-0 left-0 h-1 w-full bg-amber-400" />
                                        )}
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                'flex h-10 w-10 items-center justify-center rounded-full',
                                                enrollment?.last_deworming_date ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 text-neutral-400'
                                            )}>
                                                <Pill className="h-5 w-5" />
                                            </div>
                                            <div>
                                                {enrollment?.last_deworming_date ? (
                                                    <>
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {formatDate(enrollment.last_deworming_date)}
                                                        </p>
                                                        <Badge variant={dewormingStatus.variant} className="mt-1">
                                                            {dewormingStatus.label}
                                                        </Badge>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic">Not recorded</p>
                                                )}
                                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mt-0.5">Last Deworming</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* ── Two-column detail grid ── */}
                    <div className="grid gap-6 lg:grid-cols-2">

                        {/* Left column: Personal + Education */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Personal Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 pt-0">
                                        <InfoRow icon={Calendar} label="Date of Birth" value={age ? `${formatDate(student.date_of_birth)} (${age} yrs)` : formatDate(student.date_of_birth)} iconClass="bg-blue-50 text-blue-500" />
                                        <InfoRow icon={UsersIcon} label="Gender" value={student.gender} iconClass="bg-purple-50 text-purple-500" />
                                        <InfoRow icon={Phone} label="Phone" value={student.phone_number} iconClass="bg-green-50 text-green-500" />
                                        <InfoRow icon={MapPin} label="Compound Area" value={student.compound_area} iconClass="bg-orange-50 text-orange-500" />
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Education</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 pt-0">
                                        <InfoRow icon={School} label="Grade Level" value={enrollment?.grade_level} iconClass="bg-indigo-50 text-indigo-500" />
                                        <InfoRow
                                            icon={MapPin}
                                            label="School"
                                            value={enrollment?.government_school?.school_name || 'On Site'}
                                            iconClass="bg-teal-50 text-teal-500"
                                        />
                                        <InfoRow icon={Calendar} label="Enrolled" value={formatDate(enrollment?.enrollment_date)} iconClass="bg-sky-50 text-sky-500" />
                                        <InfoRow icon={FileText} label="Report Cards" value={`${reportCardsCount} submitted`} iconClass="bg-amber-50 text-amber-500" />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Right column: Attendance + Family + Emergency */}
                        <div className="space-y-6">

                            {/* Attendance */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Attendance (Last 30 Days)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {attendanceData ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-20 w-20 shrink-0">
                                                        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                                                            <path
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                                className="text-neutral-100"
                                                            />
                                                            <path
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                                strokeDasharray={`${attendanceData.summary.percentage}, 100`}
                                                                strokeLinecap="round"
                                                                className="text-primary-500"
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-lg font-bold">{attendanceData.summary.percentage}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm flex-1">
                                                        <div>
                                                            <p className="text-muted-foreground">Present</p>
                                                            <p className="text-lg font-semibold text-green-600">{attendanceData.summary.present}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Absent</p>
                                                            <p className="text-lg font-semibold text-red-600">{attendanceData.summary.absent}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No attendance records</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Family */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <UsersIcon className="h-5 w-5 text-indigo-500" />
                                            Family
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {relationships && relationships.filter(r => r.person).length > 0 ? (
                                            <div className="space-y-2">
                                                {relationships.filter(r => r.person).map((rel) => (
                                                    <button
                                                        key={rel.id}
                                                        type="button"
                                                        className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent group"
                                                        onClick={() => setSelectedParentForDetail(rel.person)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <PersonAvatar
                                                                photoUrl={rel.person.photo_url}
                                                                gender={rel.person.gender}
                                                                firstName={rel.person.first_name}
                                                                lastName={rel.person.last_name}
                                                                className="h-10 w-10"
                                                            />
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {rel.person.first_name} {rel.person.last_name}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-xs text-muted-foreground">{rel.relationship_type}</span>
                                                                    {rel.is_primary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>}
                                                                    {rel.is_emergency_contact && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700">Emergency</Badge>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No family members linked</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Emergency Contact */}
                            {(emergencyName || emergencyPhone) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    <Card className="border-amber-200 bg-amber-50/30">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div className="text-sm">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Emergency Contact</p>
                                                    <p className="mt-1 font-semibold text-foreground">{emergencyName || 'Not provided'}</p>
                                                    <div className="mt-0.5 flex items-center gap-3 text-muted-foreground">
                                                        {emergencyPhone && <span>{emergencyPhone}</span>}
                                                        {emergencyRel && <span>&middot; {emergencyRel}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* General Notes */}
                    {student.notes && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-foreground whitespace-pre-wrap">{student.notes}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="case-notes">
                    <CaseNotes personId={id} />
                </TabsContent>

                <TabsContent value="documents">
                    <StudentDocuments studentId={id} />
                </TabsContent>
            </Tabs>

            {selectedParentForDetail && (
                <ParentDetailCard
                    parent={selectedParentForDetail}
                    isOpen={!!selectedParentForDetail}
                    onClose={() => setSelectedParentForDetail(null)}
                />
            )}
        </div>
    )
}
