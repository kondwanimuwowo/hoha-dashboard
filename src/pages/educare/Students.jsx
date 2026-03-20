import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStudents } from '@/hooks/useStudents'
import { useParents } from '@/hooks/usePeople'
import { useSchools, useDeleteSchool } from '@/hooks/useSchools'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { StudentTable } from '@/components/educare/StudentTable'
import { StudentForm } from '@/components/educare/StudentForm'
import { ParentTable } from '@/components/educare/ParentTable'
import { ParentForm } from '@/components/educare/ParentForm'
import { ParentDetailCard } from '@/components/educare/ParentDetailCard'
import { UserPlus, Users, GraduationCap, Home, Settings2, Trash2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GRADE_LEVELS, ENROLLMENT_STATUS } from '@/lib/constants'
import { Search, Filter, Printer } from 'lucide-react'
import { RegistrationFilter } from '@/components/shared/RegistrationFilter'

export function Students() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    // Persist filter state in URL params
    const activeTab = searchParams.get('tab') ?? 'students'
    const gradeFilter = searchParams.get('grade') ?? 'all'
    const statusFilter = searchParams.get('status') ?? 'Active'
    const schoolFilter = searchParams.get('school') ?? 'all'
    const registrationFilter = searchParams.get('reg') ?? 'all'

    // Local state for search input (debounced writes to URL)
    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') ?? '')

    const [showAddStudent, setShowAddStudent] = useState(false)
    const [showAddParent, setShowAddParent] = useState(false)
    const [sorting, setSorting] = useState([{ id: 'first_name', desc: false }])
    const [selectedParent, setSelectedParent] = useState(null)
    const [showManageSchools, setShowManageSchools] = useState(false)
    const [schoolToDelete, setSchoolToDelete] = useState(null)

    const setParam = (key, val) => setSearchParams(prev => {
        const p = new URLSearchParams(prev)
        p.set(key, val)
        return p
    }, { replace: true })

    const setActiveTab = (val) => setParam('tab', val)
    const setGradeFilter = (val) => setParam('grade', val)
    const setStatusFilter = (val) => setParam('status', val)
    const setSchoolFilter = (val) => setParam('school', val)
    const setRegistrationFilter = (val) => setParam('reg', val)

    const deleteSchool = useDeleteSchool()

    const handleDeleteSchool = async (school) => {
        try {
            await deleteSchool.mutateAsync(school.id)
            toast.success(`"${school.school_name}" removed`)
            setSchoolToDelete(null)
        } catch (error) {
            toast.error('Failed to remove school: ' + error.message)
        }
    }

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const trimmed = searchInput.trim()
            setDebouncedSearch(trimmed)
            setSearchParams(prev => {
                const p = new URLSearchParams(prev)
                trimmed ? p.set('search', trimmed) : p.delete('search')
                return p
            }, { replace: true })
        }, 300)
        return () => window.clearTimeout(timer)
    }, [searchInput])

    const { data: schools } = useSchools()
    const { data: students, isLoading: isLoadingStudents } = useStudents({
        search: debouncedSearch,
        gradeLevel: gradeFilter === 'all' ? undefined : gradeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        school: schoolFilter === 'all' ? undefined : schoolFilter,
        registrationStatus: registrationFilter === 'all' ? undefined : registrationFilter,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc'
    })

    const { data: parents, isLoading: isLoadingParents } = useParents(debouncedSearch)

    const isLoading = activeTab === 'students' ? isLoadingStudents : isLoadingParents

    if (isLoading && !students && !parents) return <LoadingSpinner />

    const handleHeaderAction = () => {
        if (activeTab === 'students') {
            setShowAddStudent(true)
        } else {
            setShowAddParent(true)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Educare Dashboard"
                description={
                    activeTab === 'students'
                        ? `${students?.length || 0} students enrolled in Educare Africa`
                        : `${parents?.length || 0} parent records with children in Educare`
                }
                action={handleHeaderAction}
                actionLabel={activeTab === 'students' ? "Register Student" : "Register Parent"}
                actionIcon={UserPlus}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="space-y-4 mb-6">
                    {/* Row 1: Tabs + Print */}
                    <div className="flex items-center justify-between">
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
                    </div>

                    {/* Row 2: Search — always full width */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            placeholder={activeTab === 'students' ? "Search by name, phone..." : "Search parents..."}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Row 3: Filters (students tab only) */}
                    {activeTab === 'students' && (
                        <div className="flex flex-wrap gap-2">
                            <RegistrationFilter
                                value={registrationFilter}
                                onChange={setRegistrationFilter}
                            />

                            <Select value={gradeFilter} onValueChange={setGradeFilter}>
                                <SelectTrigger className="w-full sm:w-[160px]">
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

                            <div className="flex items-center gap-1">
                                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                                    <SelectTrigger className="w-full sm:w-[170px]">
                                        <GraduationCap className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="School" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64 overflow-y-auto">
                                        <SelectItem value="all">All Schools</SelectItem>
                                        <SelectItem value="On Site">On Site</SelectItem>
                                        {schools?.map((school) => (
                                            <SelectItem key={school.id} value={school.school_name}>
                                                {school.school_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    title="Manage schools"
                                    onClick={() => setShowManageSchools(true)}
                                >
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[140px]">
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

                <TabsContent value="students" className="mt-0 space-y-4">
                    {students && students.length > 0 ? (
                        <StudentTable
                            data={students}
                            onRowClick={(student) => navigate(`/educare/students/${student.person_id}`)}
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
                            action={() => setShowAddParent(true)}
                            actionLabel="Register Parent"
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Add Student Dialog */}
            <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Register New Student</DialogTitle>
                        <DialogDescription>
                            Create a new student record and link guardian/emergency details.
                        </DialogDescription>
                    </DialogHeader>
                    <StudentForm
                        onSuccess={() => {
                            setShowAddStudent(false)
                        }}
                        onCancel={() => setShowAddStudent(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Add Parent Dialog */}
            <Dialog open={showAddParent} onOpenChange={setShowAddParent}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Register New Parent</DialogTitle>
                        <DialogDescription>
                            Create a parent or guardian profile and link children.
                        </DialogDescription>
                    </DialogHeader>
                    <ParentForm
                        onSuccess={() => {
                            setShowAddParent(false)
                        }}
                        onCancel={() => setShowAddParent(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Parent Details Card */}
            <ParentDetailCard
                parent={selectedParent}
                isOpen={!!selectedParent}
                onClose={() => setSelectedParent(null)}
            />

            {/* Manage Schools Dialog */}
            <Dialog open={showManageSchools} onOpenChange={setShowManageSchools}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Manage Schools
                        </DialogTitle>
                        <DialogDescription>
                            Remove government schools that are no longer needed. Students assigned to a removed school will retain their existing assignment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-80 overflow-y-auto py-2">
                        {schools?.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4">No schools added yet.</p>
                        )}
                        {schools?.map((school) => (
                            <div key={school.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <div>
                                    <p className="text-sm font-medium">{school.school_name}</p>
                                    {school.location && (
                                        <p className="text-xs text-muted-foreground">{school.location}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => setSchoolToDelete(school)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete School Dialog */}
            <Dialog open={!!schoolToDelete} onOpenChange={(open) => { if (!open) setSchoolToDelete(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove School?</DialogTitle>
                        <DialogDescription>
                            Remove <strong>{schoolToDelete?.school_name}</strong> from the schools list? It will be hidden from filters and new student forms.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSchoolToDelete(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={deleteSchool.isPending}
                            onClick={() => handleDeleteSchool(schoolToDelete)}
                        >
                            {deleteSchool.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
