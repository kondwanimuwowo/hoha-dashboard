import { useParams, useNavigate } from 'react-router-dom'
import { useEmergencyDistribution, useMarkEmergencyCollected } from '@/hooks/useEmergencyRelief'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Package, Users, Printer, CheckCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { toast } from 'sonner'

export function EmergencyReliefDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data: distribution, isLoading } = useEmergencyDistribution(id)
    const markCollected = useMarkEmergencyCollected()

    if (isLoading) return <LoadingSpinner />

    if (!distribution) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                Distribution not found.
            </div>
        )
    }

    const recipients = distribution.recipients || []
    const collectedCount = recipients.filter(r => r.collected || r.is_collected).length
    const total = recipients.length

    const handleToggleCollected = async (recipient) => {
        const newState = !(recipient.collected || recipient.is_collected)
        try {
            await markCollected.mutateAsync({ recipientId: recipient.id, collected: newState })
            toast.success(newState ? 'Marked as collected' : 'Marked as pending')
        } catch (err) {
            toast.error('Failed to update: ' + err.message)
        }
    }

    const handlePrint = () => {
        const rows = recipients.map((r, i) => {
            const head = r.family_head
            const name = head ? `${head.first_name || ''} ${head.last_name || ''}`.trim() : 'Unknown'
            const isCollected = r.collected || r.is_collected
            return `<tr>
                <td>${i + 1}</td>
                <td>${name}</td>
                <td>${head?.phone_number || '-'}</td>
                <td>${r.items_provided || '-'}</td>
                <td>${isCollected ? 'Collected' : 'Pending'}</td>
            </tr>`
        }).join('')

        const html = `<!doctype html><html><head><meta charset="utf-8"/>
            <title>Emergency Relief Distribution</title>
            <style>body{font-family:Arial,sans-serif;padding:20px;color:#111;}h1{margin-bottom:4px;}
            .meta{color:#555;font-size:13px;margin-bottom:16px;}
            table{width:100%;border-collapse:collapse;}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;}
            th{background:#f5f5f5;}</style></head>
            <body><h1>Emergency Relief Distribution</h1>
            <div class="meta">
                <div><strong>Date:</strong> ${formatDate(distribution.distribution_date)}</div>
                <div><strong>Reason:</strong> ${distribution.reason || 'Emergency relief distribution'}</div>
                <div><strong>Collected:</strong> ${collectedCount}/${total}</div>
            </div>
            <table><thead><tr><th>#</th><th>Family Head</th><th>Phone</th><th>Items</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody></table></body></html>`

        const win = window.open('', '_blank')
        if (!win) return
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print List
                </Button>
            </div>

            {/* Distribution Info */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p className="font-semibold">{formatDate(distribution.distribution_date)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Reason</p>
                                <p className="font-semibold">{distribution.reason || 'Emergency relief distribution'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm text-muted-foreground">Collection Progress</p>
                                <p className="font-semibold">{collectedCount}/{total} collected</p>
                            </div>
                        </div>
                    </div>

                    {distribution.notes && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Notes</p>
                            <p className="mt-1">{distribution.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recipients */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Recipients ({total})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {total === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No recipients recorded for this distribution.</p>
                    ) : (
                        <div className="space-y-2">
                            {recipients.map((recipient) => {
                                const head = recipient.family_head
                                const isCollected = recipient.collected || recipient.is_collected
                                return (
                                    <div
                                        key={recipient.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <PersonAvatar
                                                firstName={head?.first_name}
                                                lastName={head?.last_name}
                                                gender={head?.gender}
                                                className="h-9 w-9"
                                            />
                                            <div>
                                                <p className="font-medium">
                                                    {head ? `${head.first_name || ''} ${head.last_name || ''}`.trim() : 'Unknown'}
                                                </p>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    {head?.phone_number && <span>{head.phone_number}</span>}
                                                    {recipient.items_provided && <span>Items: {recipient.items_provided}</span>}
                                                </div>
                                                {recipient.collected_by && (
                                                    <p className="text-xs text-muted-foreground">Collected by: {recipient.collected_by}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={isCollected ? 'success' : 'secondary'}>
                                                {isCollected ? 'Collected' : 'Pending'}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleCollected(recipient)}
                                                disabled={markCollected.isPending}
                                            >
                                                {isCollected ? (
                                                    <Clock className="h-4 w-4" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
