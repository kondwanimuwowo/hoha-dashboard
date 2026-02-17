import { useParams, useNavigate } from 'react-router-dom'
import { useOutreachDetail } from '@/hooks/useOutreach'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Calendar, Users, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export function OutreachDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: outreach, isLoading } = useOutreachDetail(id)

    if (isLoading) return <LoadingSpinner />

    if (!outreach) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Outreach event not found</p>
                <Button variant="link" onClick={() => navigate('/community-outreach')}>
                    Back to Outreach
                </Button>
            </div>
        )
    }

    // Group expenses by type
    const expensesByType = outreach.expenses?.reduce((acc, expense) => {
        if (!acc[expense.expense_type]) {
            acc[expense.expense_type] = []
        }
        acc[expense.expense_type].push(expense)
        return acc
    }, {}) || {}

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/community-outreach')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <PageHeader
                    title="Outreach Event Details"
                    description={formatDate(outreach.outreach_date)}
                />
            </div>

            {/* Event Info */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-lg bg-purple-50">
                                <MapPin className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p className="font-semibold">{outreach.location?.name || 'N/A'}</p>
                                {outreach.location_name && (
                                    <p className="text-sm text-muted-foreground">{outreach.location_name}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-lg bg-blue-50">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p className="font-semibold">{formatDate(outreach.outreach_date)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-lg bg-green-50">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">People Helped</p>
                                <p className="font-semibold">{outreach.total_participants || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-lg bg-orange-50">
                                <DollarSign className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Expenses</p>
                                <p className="font-semibold">{formatCurrency(outreach.total_expenses || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notes */}
            {outreach.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{outreach.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Participants */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Participants ({outreach.participants?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {outreach.participants && outreach.participants.length > 0 ? (
                            outreach.participants.map((participant) => (
                                <div
                                    key={participant.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {participant.person
                                                ? `${participant.person.first_name} ${participant.person.last_name}`
                                                : participant.ad_hoc_name
                                            }
                                        </p>
                                        {participant.person?.phone_number && (
                                            <p className="text-sm text-muted-foreground">
                                                {participant.person.phone_number}
                                            </p>
                                        )}
                                        {participant.notes && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {participant.notes}
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant={participant.is_registered_member ? 'default' : 'secondary'}>
                                        {participant.is_registered_member ? 'Registered' : 'Non-Registered'}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No participants recorded</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Expenses */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Financial Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    {outreach.expenses && outreach.expenses.length > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(expensesByType).map(([type, expenses]) => (
                                <div key={type} className="space-y-2">
                                    <h4 className="font-semibold text-sm">{type}</h4>
                                    <div className="space-y-1 pl-4">
                                        {expenses.map((expense) => (
                                            <div key={expense.id} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {expense.description || 'No description'}
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(expense.amount)}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                                            <span>Subtotal:</span>
                                            <span>
                                                {formatCurrency(
                                                    expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between text-lg font-bold pt-4 border-t-2">
                                <span>Total:</span>
                                <span>{formatCurrency(outreach.total_expenses || 0)}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No expenses recorded</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
