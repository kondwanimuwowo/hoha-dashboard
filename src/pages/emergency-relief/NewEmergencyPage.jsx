import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmergencyDistributionForm } from '@/components/emergency-relief/EmergencyDistributionForm'

export function NewEmergencyPage() {
    const navigate = useNavigate()
    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/emergency-relief')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Emergency Relief
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">New Emergency Distribution</h1>
            <Card className="bg-white dark:bg-card shadow-sm">
                <CardContent className="p-6">
                    <EmergencyDistributionForm
                        onSuccess={() => navigate('/emergency-relief')}
                        onCancel={() => navigate('/emergency-relief')}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
