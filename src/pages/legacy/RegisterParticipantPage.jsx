import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WomenForm } from '@/components/legacy/WomenForm'

export function RegisterParticipantPage() {
    const navigate = useNavigate()
    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/legacy/participants')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Participants
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Register New Participant</h1>
            <Card className="bg-white dark:bg-card shadow-sm">
                <CardContent className="p-6">
                    <WomenForm
                        onSuccess={() => navigate('/legacy/participants')}
                        onCancel={() => navigate('/legacy/participants')}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
