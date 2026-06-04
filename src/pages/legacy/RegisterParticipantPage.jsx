import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WomenForm } from '@/components/legacy/WomenForm'

export function RegisterParticipantPage() {
    const navigate = useNavigate()
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/legacy/participants')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Participants
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Register New Participant</h1>
            <WomenForm
                onSuccess={() => navigate('/legacy/participants')}
                onCancel={() => navigate('/legacy/participants')}
            />
        </div>
    )
}
