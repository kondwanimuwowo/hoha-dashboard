import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WomenForm } from '@/components/legacy/WomenForm'
import { useWoman } from '@/hooks/useWomen'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function EditParticipantPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: womanData, isLoading, isError } = useWoman(id)

    if (isLoading) return <LoadingSpinner />
    if (isError || !womanData) return <div>Participant not found</div>

    const woman = womanData.woman

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(`/legacy/participants/${id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {woman.first_name} {woman.last_name}
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Edit Participant</h1>
            <Card className="bg-white dark:bg-card shadow-sm">
                <CardContent className="p-6">
                    <WomenForm
                        initialData={womanData}
                        onSuccess={() => navigate(`/legacy/participants/${id}`)}
                        onCancel={() => navigate(`/legacy/participants/${id}`)}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
