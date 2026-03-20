import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useWoman, useDeleteWoman } from '@/hooks/useWomen'
import { useLegacyAttendanceSummary } from '@/hooks/useLegacyAttendance'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, calculateAge, cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft, Edit, Phone, Calendar, Award, Users as UsersIcon,
    Trash2, Printer, MapPin, ChevronRight, Clock
} from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { WomenForm } from '@/components/legacy/WomenForm'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CaseNotes } from '@/components/records/CaseNotes'

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

export function WomanProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: womanData, isLoading } = useWoman(id)
    const deleteWoman = useDeleteWoman()
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 60)
    const { data: attendanceData } = useLegacyAttendanceSummary(
        id,
        startDate.toISOString(),
        new Date().toISOString()
    )

    if (isLoading) return <LoadingSpinner />
    if (!womanData) return <div>Participant not found</div>

    const woman = womanData.woman
    const enrollment = womanData
    const age = calculateAge(woman.date_of_birth)

    const handleDelete = async () => {
        try {
            await deleteWoman.mutateAsync(id)
            toast.success('Participant record deleted successfully')
            navigate('/legacy/participants')
        } catch (error) {
            toast.error('Failed to delete participant: ' + error.message)
        }
    }

    return (
        <div className="space-y-6">
            {/* Top bar */}
            <div className="flex items-center justify-between no-print">
                <Button variant="ghost" onClick={() => navigate('/legacy/participants')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Participants
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </div>

            {/* ── Hero Header ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600" />
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <PersonAvatar
                                    photoUrl={woman.photo_url}
                                    gender="Female"
                                    firstName={woman.first_name}
                                    lastName={woman.last_name}
                                    className="h-20 w-20 border-2 border-purple-100 shadow-sm"
                                />
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                        {woman.first_name} {woman.last_name}
                                    </h1>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                        {age != null && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {age} years old
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Award className="h-3.5 w-3.5" />
                                            {enrollment.stage}
                                        </span>
                                    </div>
                                    <div className="mt-2.5">
                                        <Badge variant={enrollment.status === 'Active' ? 'success' : 'secondary'}>
                                            {enrollment.status}
                                        </Badge>
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
                            This will mark the participant record as deleted. All historical data will be preserved but hidden.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleting(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteWoman.isPending}>
                            {deleteWoman.isPending ? 'Deleting...' : 'Confirm Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Participant</DialogTitle>
                        <DialogDescription>
                            Update information for {woman.first_name} {woman.last_name}.
                        </DialogDescription>
                    </DialogHeader>
                    {womanData && (
                        <WomenForm
                            initialData={womanData}
                            onSuccess={() => setIsEditing(false)}
                            onCancel={() => setIsEditing(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="case-notes">Case Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">

                    {/* ── Two-column detail grid ── */}
                    <div className="grid gap-6 lg:grid-cols-2">

                        {/* Left column */}
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Personal Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 pt-0">
                                        <InfoRow icon={Calendar} label="Date of Birth" value={age ? `${formatDate(woman.date_of_birth)} (${age} yrs)` : formatDate(woman.date_of_birth)} iconClass="bg-purple-50 text-purple-500" />
                                        <InfoRow icon={Phone} label="Phone" value={woman.phone_number} iconClass="bg-green-50 text-green-500" />
                                        <InfoRow icon={MapPin} label="Address" value={woman.address} iconClass="bg-orange-50 text-orange-500" />
                                        <InfoRow icon={MapPin} label="Compound Area" value={woman.compound_area} iconClass="bg-teal-50 text-teal-500" />
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Program Details */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Program Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 pt-0">
                                        <InfoRow icon={Award} label="Current Stage" value={enrollment.stage} iconClass="bg-indigo-50 text-indigo-500" />
                                        <InfoRow icon={Calendar} label="Enrolled" value={formatDate(enrollment.enrollment_date)} iconClass="bg-sky-50 text-sky-500" />
                                        {enrollment.completion_date && (
                                            <InfoRow icon={Clock} label="Completed" value={formatDate(enrollment.completion_date)} iconClass="bg-green-50 text-green-500" />
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Right column */}
                        <div className="space-y-6">

                            {/* Attendance */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Attendance (Last 60 Days)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {attendanceData ? (
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
                                                            className="text-purple-500"
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
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No attendance records</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Children in Educare */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <UsersIcon className="h-5 w-5 text-indigo-500" />
                                            Children in Educare
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {womanData.children && womanData.children.length > 0 ? (
                                            <div className="space-y-2">
                                                {womanData.children.map((rel) => (
                                                    <button
                                                        key={rel.id}
                                                        type="button"
                                                        className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent group"
                                                        onClick={() => navigate(`/educare/students/${rel.child?.id}`)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <PersonAvatar
                                                                photoUrl={rel.child?.photo_url}
                                                                gender={rel.child?.gender}
                                                                firstName={rel.child?.first_name}
                                                                lastName={rel.child?.last_name}
                                                                className="h-10 w-10"
                                                            />
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {rel.child?.first_name} {rel.child?.last_name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {calculateAge(rel.child?.date_of_birth)} years old
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No children linked in Educare</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Skills & Progress */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Skills & Progress</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {enrollment.skills_learned ? (
                                            <p className="text-foreground whitespace-pre-wrap">{enrollment.skills_learned}</p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No skills documented yet</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>

                    {/* Notes */}
                    {enrollment.notes && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Program Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-foreground whitespace-pre-wrap">{enrollment.notes}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="case-notes">
                    <CaseNotes personId={id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
