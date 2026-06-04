import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmergencyDistributionForm } from '@/components/emergency-relief/EmergencyDistributionForm'

export function NewEmergencyPage() {
    const navigate = useNavigate()
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/emergency-relief')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Emergency Relief
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">New Emergency Distribution</h1>
            <EmergencyDistributionForm
                onSuccess={() => navigate('/emergency-relief')}
                onCancel={() => navigate('/emergency-relief')}
            />
        </div>
    )
}
