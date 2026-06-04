import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudentForm } from '@/components/educare/StudentForm'
import { useStudent } from '@/hooks/useStudents'
import { useStudentGuardians } from '@/hooks/useRelationships'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function EditStudentPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: student, isLoading, isError } = useStudent(id)
    const { data: relationships } = useStudentGuardians(student?.id)

    if (isLoading) return <LoadingSpinner />
    if (isError || !student) return <div>Student not found</div>

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(`/educare/students/${id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {student.first_name} {student.last_name}
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Edit Student</h1>
            <StudentForm
                initialData={{ ...student, relationships }}
                onSuccess={() => navigate(`/educare/students/${id}`)}
                onCancel={() => navigate(`/educare/students/${id}`)}
            />
        </div>
    )
}
