import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VisitForm } from '@/components/clinicare/VisitForm'

export function NewVisitPage() {
    const navigate = useNavigate()
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/clinicare/visits')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Visits
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Record New Visit</h1>
            <VisitForm
                onSuccess={() => navigate('/clinicare/visits')}
                onCancel={() => navigate('/clinicare/visits')}
            />
        </div>
    )
}
