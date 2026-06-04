import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OutreachForm } from '@/components/community-outreach/OutreachForm'

export function NewOutreachPage() {
    const navigate = useNavigate()
    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/community-outreach')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Outreach
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Record Outreach Event</h1>
            <Card className="bg-white dark:bg-card shadow-sm">
                <CardContent className="p-6">
                    <OutreachForm
                        onSuccess={() => navigate('/community-outreach')}
                        onCancel={() => navigate('/community-outreach')}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
