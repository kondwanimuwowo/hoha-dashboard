import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOutreachEvents, useOutreachStats } from '@/hooks/useOutreach'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Heart, DollarSign, MapPin, Users, Plus, Printer } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OutreachForm } from '@/components/community-outreach/OutreachForm'

export function CommunityOutreachOverview() {
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)

    // Get current year stats
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    const { data: events, isLoading: eventsLoading } = useOutreachEvents()
    const { data: stats, isLoading: statsLoading } = useOutreachStats(startOfYear, today)

    const handlePrint = () => {
        const rows = (events || []).map((ev, i) => `<tr>
            <td>${i + 1}</td>
            <td>${formatDate(ev.outreach_date)}</td>
            <td>${ev.location?.name || ev.location_name || '-'}</td>
            <td>${ev.total_participants || 0}</td>
            <td>${formatCurrency(ev.total_expenses || 0)}</td>
        </tr>`).join('')

        const html = `<!doctype html><html><head><meta charset="utf-8"/>
            <title>Community Outreach Events</title>
            <style>body{font-family:Arial,sans-serif;padding:20px;color:#111;}h1{margin-bottom:4px;}
            .meta{color:#555;font-size:13px;margin-bottom:16px;}
            table{width:100%;border-collapse:collapse;}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;}
            th{background:#f5f5f5;}</style></head>
            <body><h1>Community Outreach Events</h1>
            <div class="meta">Generated ${new Date().toLocaleDateString()} · ${(events || []).length} events</div>
            <table><thead><tr><th>#</th><th>Date</th><th>Location</th><th>Participants</th><th>Expenses</th></tr></thead>
            <tbody>${rows}</tbody></table></body></html>`

        const win = window.open('', '_blank')
        if (!win) return
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
    }

    if (eventsLoading || statsLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Community Outreach"
                description="Track weekly outreach activities helping communities across hospitals, schools, and homes"
            />

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Outreach Events"
                    value={stats?.totalEvents || 0}
                    subtitle="This year"
                    icon={Heart}
                    colorClass="bg-purple-50 text-purple-600"
                />
                <StatsCard
                    title="People Helped"
                    value={stats?.totalPeople || 0}
                    subtitle="Individuals assisted"
                    icon={Users}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatsCard
                    title="Total Expenses"
                    value={formatCurrency(stats?.totalExpenses || 0)}
                    subtitle="Financial support"
                    icon={DollarSign}
                    colorClass="bg-green-50 text-green-600"
                />
                <StatsCard
                    title="Locations Visited"
                    value={stats?.uniqueLocations || 0}
                    subtitle="Different sites"
                    icon={MapPin}
                    colorClass="bg-orange-50 text-orange-600"
                />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
                <Button
                    className="w-full md:w-auto"
                    onClick={() => setShowCreate(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Record Outreach
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print List
                </Button>
            </div>

            {/* Recent Outreach Events */}
            <Card>
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Outreach Events</h3>
                    <div className="space-y-3">
                        {events && events.length > 0 ? (
                            events.slice(0, 10).map((event, index) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer"
                                    onClick={() => navigate(`/community-outreach/${event.id}`)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-50">
                                                <MapPin className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {event.location?.name || event.location_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(event.outreach_date)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-foreground">
                                            {event.total_participants || 0} people
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatCurrency(event.total_expenses || 0)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                No outreach events recorded yet. Click "Record Outreach" to get started.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Create Outreach Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record Community Outreach</DialogTitle>
                        <DialogDescription>
                            Document the outreach event including location, people helped, and expenses
                        </DialogDescription>
                    </DialogHeader>
                    <OutreachForm
                        onSuccess={() => setShowCreate(false)}
                        onCancel={() => setShowCreate(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
