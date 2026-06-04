import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StudentForm } from '@/components/educare/StudentForm'

export function RegisterStudentPage() {
    const navigate = useNavigate()
    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/educare/students')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Students
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Register New Student</h1>
            <Card className="bg-white dark:bg-card shadow-sm">
                <CardContent className="p-6">
                    <StudentForm
                        onSuccess={() => navigate('/educare/students')}
                        onCancel={() => navigate('/educare/students')}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
