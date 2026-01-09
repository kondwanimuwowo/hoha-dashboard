import { useParams, useNavigate } from 'react-router-dom'
import { useStudent, useDeleteStudent } from '@/hooks/useStudents'
import { useAttendanceSummary } from '@/hooks/useAttendance'
import { useRelationships } from '@/hooks/useRelationships'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Phone, MapPin, Calendar, School, Users as UsersIcon, Trash2, Printer, FileText, ClipboardList } from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StudentForm } from '@/components/educare/StudentForm'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL

import { CaseNotes } from '@/components/records/CaseNotes'
import { StudentDocuments } from '@/components/records/StudentDocuments'

export function StudentProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: student, isLoading } = useStudent(id)
    const { data: relationships } = useRelationships(id)
    const deleteStudent = useDeleteStudent()

    // Get attendance for last 30 days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const { data: attendanceData } = useAttendanceSummary(id, startDate.toISOString(), new Date().toISOString())

    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    if (isLoading) return <LoadingSpinner />
    if (!student) return <div>Student not found</div>

    const enrollment = student.educare_enrollment?.[0]
    const age = calculateAge(student.date_of_birth)

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/educare/students')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Students
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Record
                    </Button>
                </div>
            </div>

            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <PersonAvatar
                                    photoUrl={student.photo_url}
                                    gender={student.gender}
                                    firstName={student.first_name}
                                    lastName={student.last_name}
                                    className="h-20 w-20 border-2 border-primary/10"
                                />
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {student.first_name} {student.last_name}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        {age && (
                                            <span className="flex items-center">
                                                <Calendar className="mr-1 h-4 w-4" />
                                                {age} years old
                                            </span>
                                        )}
                                        <span className="flex items-center">
                                            <School className="mr-1 h-4 w-4" />
                                            {enrollment?.grade_level || 'No Grade'}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <Badge variant={getStatusVariant(enrollment?.current_status)}>
                                            {enrollment?.current_status || 'Unknown'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button onClick={() => setIsEditing(true)} className="w-full">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Button>
                                <Button variant="destructive" onClick={() => setIsDeleting(true)} className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Record
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Delete Confirmation Dialog */}
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
                            initialData={student}
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
                    {/* Details Grid */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Personal Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Personal Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                                        <p className="font-medium text-foreground">{formatDate(student.date_of_birth)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Gender</p>
                                        <p className="font-medium text-foreground">{student.gender}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Address</p>
                                        <p className="font-medium text-foreground">{student.address || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Compound Area</p>
                                        <p className="font-medium text-foreground">{student.compound_area || 'Not provided'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Education Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Education</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Grade Level</p>
                                        <p className="font-medium text-foreground">{enrollment?.grade_level}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Government School</p>
                                        <p className="font-medium text-foreground">
                                            {enrollment?.government_school_id ? 'Assigned' : 'HOHA Only (Baby/Reception)'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Enrollment Date</p>
                                        <p className="font-medium text-foreground">{formatDate(enrollment?.enrollment_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge variant={enrollment?.current_status === 'Active' ? 'success' : 'secondary'}>
                                            {enrollment?.current_status}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Attendance Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Attendance (Last 30 Days)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {attendanceData ? (
                                        <div className="space-y-4">
                                            <div className="text-center">
                                                <div className="text-4xl font-bold text-primary">
                                                    {attendanceData.summary.percentage}%
                                                </div>
                                                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Present</p>
                                                    <p className="font-semibold text-green-600 dark:text-green-400">{attendanceData.summary.present}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Absent</p>
                                                    <p className="font-semibold text-red-600 dark:text-red-400">{attendanceData.summary.absent}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-neutral-500">No attendance records</p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Family & Emergency Contacts */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                        <UsersIcon className="mr-2 h-5 w-5" />
                                        Family Members
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {relationships && relationships.length > 0 ? (
                                        <div className="space-y-3">
                                            {relationships.map((rel) => (
                                                <div key={rel.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {rel.related_person?.first_name} {rel.related_person?.last_name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">{rel.relationship_type}</p>
                                                    </div>
                                                    {rel.is_primary && (
                                                        <Badge variant="secondary">Primary</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No family members linked</p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Emergency Contact</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Contact Name</p>
                                        <p className="font-medium text-foreground">{student.emergency_contact_name || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone Number</p>
                                        <p className="font-medium text-foreground">{student.emergency_contact_phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Relationship</p>
                                        <p className="font-medium text-foreground">{student.emergency_contact_relationship || 'Not provided'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* General Notes */}
                    {student.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">General Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-foreground whitespace-pre-wrap">{student.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="case-notes">
                    <CaseNotes personId={id} />
                </TabsContent>

                <TabsContent value="documents">
                    <StudentDocuments studentId={id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}