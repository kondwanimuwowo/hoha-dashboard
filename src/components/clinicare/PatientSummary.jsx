import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Calendar, DollarSign, Clock } from 'lucide-react'

export function PatientSummary({ summary }) {
    if (!summary) return null

    const stats = [
        {
            title: 'Total Visits',
            value: summary.totalVisits,
            icon: Calendar,
            description: 'Lifetime visits',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            title: 'Total Cost',
            value: `ZMW ${summary.totalCost?.toFixed(2)}`,
            icon: DollarSign,
            description: `Patient paid: ZMW ${summary.totalPatientContribution?.toFixed(2)}`,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            title: 'Emergency Visits',
            value: summary.emergencyVisits,
            icon: Activity,
            description: 'Urgent care required',
            color: 'text-red-600',
            bg: 'bg-red-50',
        },
        {
            title: 'Pending Follow-ups',
            value: summary.pendingFollowUps,
            icon: Clock,
            description: 'Scheduled or required',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-full ${stat.bg}`}>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-neutral-500 mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
