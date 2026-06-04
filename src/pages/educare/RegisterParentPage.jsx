import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ParentForm } from '@/components/educare/ParentForm'

export function RegisterParentPage() {
    const navigate = useNavigate()
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/educare/students?tab=parents')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Parents
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Register New Parent</h1>
            <ParentForm
                onSuccess={() => navigate('/educare/students?tab=parents')}
                onCancel={() => navigate('/educare/students?tab=parents')}
            />
        </div>
    )
}
