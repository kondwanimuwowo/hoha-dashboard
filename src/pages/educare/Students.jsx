import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudents } from '@/hooks/useStudents'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { StudentTable } from '@/components/educare/StudentTable'
import { StudentForm } from '@/components/educare/StudentForm'
import { UserPlus, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GRADE_LEVELS, ENROLLMENT_STATUS } from '@/lib/constants'
import { Search, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

export function Students() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [gradeFilter, setGradeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('Active')
    const [showAddStudent, setShowAddStudent] = useState(false)

    const { data: students, isLoading } = useStudents({
        search,
        gradeLevel: gradeFilter === 'all' ? undefined : gradeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
    })

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Students"
                description={`${students?.length || 0} students enrolled in Educare Africa`}
                action={() => setShowAddStudent(true)}
                actionLabel="Register Student"
                actionIcon={UserPlus}
            />

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-[200px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {GRADE_LEVELS.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                                {grade}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.values(ENROLLMENT_STATUS).map((status) => (
                            <SelectItem key={status} value={status}>
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Table */}
            {students && students.length > 0 ? (
                <StudentTable
                    data={students}
                    onRowClick={(student) => navigate(`/educare/students/${student.id}`)}
                />
            ) : (
                <EmptyState
                    icon={Users}
                    title="No students found"
                    description="Get started by registering your first student"
                    action={() => setShowAddStudent(true)}
                    actionLabel="Register Student"
                />
            )}

            {/* Add Student Dialog */}
            <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Register New Student</DialogTitle>
                    </DialogHeader>
                    <StudentForm
                        onSuccess={() => {
                            setShowAddStudent(false)
                        }}
                        onCancel={() => setShowAddStudent(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}