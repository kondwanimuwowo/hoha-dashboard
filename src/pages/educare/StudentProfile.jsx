import { useParams, useNavigate } from 'react-router-dom'
import { useStudent } from '@/hooks/useStudents'
import { useAttendanceSummary } from '@/hooks/useAttendance'
import { useRelationships } from '@/hooks/useRelationships'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Edit, Phone, MapPin, Calendar, School, Users as UsersIcon } from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { StudentForm } from '@/components/educare/StudentForm'
import { useState } from 'react'
import { motion } from 'framer-motion'
const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL

export function StudentProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: student, isLoading } = useStudent(id)
    const { data: relationships } = useRelationships(id)

    // Get attendance for last 30 days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const { data: attendanceData } = useAttendanceSummary(id, startDate.toISOString(), new Date().toISOString())
    const [isEditing, setIsEditing] = useState(false)

    if (isLoading) return <LoadingSpinner />


    if (!student) return <div>Student not found</div>

    const enrollment = student.educare_enrollment?.[0]
    const age = calculateAge(student.date_of_birth)

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/educare/students')}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Students
            </Button>

            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage
                                        src={student.photo_url?.startsWith('http')
                                            ? student.photo_url
                                            : `${SUPABASE_PROJECT_URL}/storage/v1/object/public/photos/${student.photo_url}`
                                        }
                                    />
                                    <AvatarFallback className="text-2xl">
                                        {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
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
                                            {enrollment?.grade_level}
                                        </span>
                                        {student.phone_number && (
                                            <span className="flex items-center">
                                                <Phone className="mr-1 h-4 w-4" />
                                                {student.phone_number}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <Badge variant={enrollment?.current_status === 'Active' ? 'success' : 'secondary'}>
                                            {enrollment?.current_status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => setIsEditing(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

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
                                        <div>
                                            <p className="text-muted-foreground">Excused</p>
                                            <p className="font-semibold text-foreground">{attendanceData.summary.excused}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Late</p>
                                            <p className="font-semibold text-orange-600 dark:text-orange-400">{attendanceData.summary.late}</p>
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

            {/* Notes */}
            {student.notes && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
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
        </div>
    )
}