import { useParams, useNavigate } from 'react-router-dom'
import { useWoman } from '@/hooks/useWomen'
import { useLegacyAttendanceSummary } from '@/hooks/useLegacyAttendance'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Edit, Phone, Calendar, Award, Users as UsersIcon } from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'
import { motion } from 'framer-motion'

export function WomanProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: womanData, isLoading } = useWoman(id)

    // Get attendance for last 60 days
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

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/legacy/participants')}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Participants
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
                                    <AvatarImage src={woman.photo_url} />
                                    <AvatarFallback className="text-2xl bg-purple-100 text-purple-700">
                                        {woman.first_name?.charAt(0)}{woman.last_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {woman.first_name} {woman.last_name}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        {age && (
                                            <span className="flex items-center">
                                                <Calendar className="mr-1 h-4 w-4" />
                                                {age} years old
                                            </span>
                                        )}
                                        <span className="flex items-center">
                                            <Award className="mr-1 h-4 w-4" />
                                            {enrollment.stage}
                                        </span>
                                        {woman.phone_number && (
                                            <span className="flex items-center">
                                                <Phone className="mr-1 h-4 w-4" />
                                                {woman.phone_number}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <Badge variant={enrollment.status === 'Active' ? 'success' : 'secondary'}>
                                            {enrollment.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <Button>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

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
                                <p className="font-medium text-foreground">{formatDate(woman.date_of_birth)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Phone Number</p>
                                <p className="font-medium text-foreground">{woman.phone_number || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium text-foreground">{woman.address || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Compound Area</p>
                                <p className="font-medium text-foreground">{woman.compound_area || 'Not provided'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Program Information */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Program Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Stage</p>
                                <p className="font-medium text-foreground">{enrollment.stage}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Enrollment Date</p>
                                <p className="font-medium text-foreground">{formatDate(enrollment.enrollment_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={enrollment.status === 'Active' ? 'success' : 'secondary'}>
                                    {enrollment.status}
                                </Badge>
                            </div>
                            {enrollment.completion_date && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Completion Date</p>
                                    <p className="font-medium text-foreground">{formatDate(enrollment.completion_date)}</p>
                                </div>
                            )}
                            {enrollment.mentor && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Mentor</p>
                                    <p className="font-medium text-foreground">
                                        {enrollment.mentor.first_name} {enrollment.mentor.last_name}
                                    </p>
                                </div>
                            )}
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
                            <CardTitle className="text-lg">Attendance (Last 60 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {attendanceData ? (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
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
                                            <p className="text-muted-foreground">Total</p>
                                            <p className="font-semibold text-foreground">{attendanceData.summary.total}</p>
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

            {/* Children & Skills */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Children in Educare */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <UsersIcon className="mr-2 h-5 w-5" />
                                Children in Educare
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {womanData.children && womanData.children.length > 0 ? (
                                <div className="space-y-3">
                                    {womanData.children.map((rel) => (
                                        <div key={rel.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {rel.child?.first_name} {rel.child?.last_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {calculateAge(rel.child?.date_of_birth)} years old
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/educare/students/${rel.child?.id}`)}
                                            >
                                                View Profile
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-500">No children linked in Educare</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Skills Learned */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
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

            {/* Notes */}
            {enrollment.notes && (
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
                            <p className="text-foreground whitespace-pre-wrap">{enrollment.notes}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}