import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudents } from '@/hooks/useStudents'
import { useParents } from '@/hooks/usePeople'
import { useSchools } from '@/hooks/useSchools'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { StudentTable } from '@/components/educare/StudentTable'
import { StudentForm } from '@/components/educare/StudentForm'
import { ParentTable } from '@/components/educare/ParentTable'
import { ParentDetailCard } from '@/components/educare/ParentDetailCard'
import { UserPlus, Users, GraduationCap, Home } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GRADE_LEVELS, ENROLLMENT_STATUS } from '@/lib/constants'
import { Search, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

export function Students() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [gradeFilter, setGradeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('Active')
    const [schoolFilter, setSchoolFilter] = useState('all')
    const [showAddStudent, setShowAddStudent] = useState(false)
    const [sorting, setSorting] = useState([{ id: 'first_name', desc: false }])
    const [activeTab, setActiveTab] = useState('students')
    const [selectedParent, setSelectedParent] = useState(null)

    const { data: schools } = useSchools()
    const { data: students, isLoading: isLoadingStudents } = useStudents({
        search,
        gradeLevel: gradeFilter === 'all' ? undefined : gradeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        school: schoolFilter === 'all' ? undefined : schoolFilter,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc'
    })

    const { data: parents, isLoading: isLoadingParents } = useParents(search)

    const isLoading = activeTab === 'students' ? isLoadingStudents : isLoadingParents

    if (isLoading && !students && !parents) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Educare Dashboard"
                description={
                    activeTab === 'students'
                        ? `${students?.length || 0} students enrolled in Educare Africa`
                        : `${parents?.length || 0} parent records with children in Educare`
                }
                action={() => setShowAddStudent(true)}
                actionLabel="Register Student"
                actionIcon={UserPlus}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <TabsList>
                        <TabsTrigger value="students" className="gap-2">
                            <Users className="h-4 w-4" />
                            All Students
                        </TabsTrigger>
                        <TabsTrigger value="parents" className="gap-2">
                            <Home className="h-4 w-4" />
                            Parents & Guardians
                        </TabsTrigger>
                    </TabsList>

                    {/* Filters - Always show search, show others only for students */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <Input
                                placeholder={activeTab === 'students' ? "Search by name..." : "Search parents..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {activeTab === 'students' && (
                            <div className="flex gap-2">
                                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Grade" />
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

                                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                                    <SelectTrigger className="w-[160px]">
                                        <GraduationCap className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="School" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Schools</SelectItem>
                                        <SelectItem value="HOHA Only">HOHA Only</SelectItem>
                                        {schools?.map((school) => (
                                            <SelectItem key={school.id} value={school.school_name}>
                                                {school.school_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[130px]">
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
                            </div>
                        )}
                    </div>
                </div>

                <TabsContent value="students" className="mt-0 space-y-4">
                    {students && students.length > 0 ? (
                        <StudentTable
                            data={students}
                            onRowClick={(student) => navigate(`/educare/students/${student.id}`)}
                            sorting={sorting}
                            onSortingChange={setSorting}
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
                </TabsContent>

                <TabsContent value="parents" className="mt-0 space-y-4">
                    {parents && parents.length > 0 ? (
                        <ParentTable
                            data={parents}
                            onRowClick={(parent) => setSelectedParent(parent)}
                            sorting={sorting}
                            onSortingChange={setSorting}
                        />
                    ) : (
                        <EmptyState
                            icon={Home}
                            title="No parent records found"
                            description="Register students with their parents to see them here"
                            action={() => setShowAddStudent(true)}
                            actionLabel="Register Student"
                        />
                    )}
                </TabsContent>
            </Tabs>

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

            {/* Parent Details Card */}
            <ParentDetailCard
                parent={selectedParent}
                isOpen={!!selectedParent}
                onClose={() => setSelectedParent(null)}
            />
        </div>
    )
}
