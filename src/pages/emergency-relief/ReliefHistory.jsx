import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Package,
    Calendar,
    ChevronDown,
    ChevronRight,
    User,
    Search
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function ReliefHistory() {
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedDistribution, setExpandedDistribution] = useState(null)

    const { data: distributions, isLoading } = useQuery({
        queryKey: ['relief-history'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('emergency_relief_distributions')
                .select(`
                    *,
                    recipients:emergency_relief_recipients(
                        *,
                        family_head:people(*)
                    )
                `)
                .order('distribution_date', { ascending: false })

            if (error) throw error
            return data
        }
    })

    const filteredDistributions = distributions?.filter(dist => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            dist.reason?.toLowerCase().includes(query) ||
            dist.recipients?.some(r =>
                `${r.family_head?.first_name} ${r.family_head?.last_name}`.toLowerCase().includes(query)
            )
        )
    })

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Emergency Relief History"
                description={`${distributions?.length || 0} relief distributions recorded`}
            />

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search by reason or recipient name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Distributions List */}
            {filteredDistributions && filteredDistributions.length > 0 ? (
                <div className="space-y-3">
                    {filteredDistributions.map((dist) => (
                        <DistributionCard
                            key={dist.id}
                            distribution={dist}
                            isExpanded={expandedDistribution === dist.id}
                            onToggle={() => setExpandedDistribution(
                                expandedDistribution === dist.id ? null : dist.id
                            )}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={Package}
                    title="No relief distributions found"
                    description={searchQuery ? "Try a different search term" : "No emergency relief has been recorded yet"}
                />
            )}
        </div>
    )
}

function DistributionCard({ distribution, isExpanded, onToggle }) {
    const collectedCount = distribution.recipients?.filter(r => r.collected).length || 0
    const totalCount = distribution.recipients?.length || 0

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                {/* Header - Clickable */}
                <button
                    onClick={onToggle}
                    className="w-full p-6 text-left hover:bg-neutral-50 dark:hover:bg-accent transition-colors"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="font-semibold text-neutral-900 dark:text-foreground">
                                        {distribution.reason || 'Emergency Relief Distribution'}
                                    </h3>
                                    <Badge variant={collectedCount === totalCount ? 'success' : 'secondary'}>
                                        {collectedCount}/{totalCount} Collected
                                    </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-neutral-600 dark:text-muted-foreground">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1.5" />
                                        {formatDate(distribution.distribution_date)}
                                    </div>
                                    <div className="flex items-center">
                                        <User className="h-4 w-4 mr-1.5" />
                                        {totalCount} {totalCount === 1 ? 'Recipient' : 'Recipients'}
                                    </div>
                                </div>
                                {distribution.notes && (
                                    <p className="mt-2 text-sm text-neutral-600 dark:text-muted-foreground line-clamp-2">
                                        {distribution.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="ml-4">
                            {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-neutral-400" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-neutral-400" />
                            )}
                        </div>
                    </div>
                </button>

                {/* Expanded Recipients List */}
                <AnimatePresence>
                    {isExpanded && distribution.recipients && distribution.recipients.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-neutral-200 dark:border-border"
                        >
                            <div className="p-6 bg-neutral-50 dark:bg-muted/30">
                                <h4 className="font-medium text-sm text-neutral-700 dark:text-foreground mb-3">
                                    Recipients
                                </h4>
                                <div className="space-y-2">
                                    {distribution.recipients.map((recipient) => (
                                        <div
                                            key={recipient.id}
                                            className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-lg border border-neutral-200 dark:border-border"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium text-neutral-900 dark:text-foreground">
                                                    {recipient.family_head?.first_name} {recipient.family_head?.last_name}
                                                </div>
                                                {recipient.items_provided && (
                                                    <div className="text-sm text-neutral-600 dark:text-muted-foreground mt-1">
                                                        Items: {recipient.items_provided}
                                                    </div>
                                                )}
                                                {recipient.collected_by && (
                                                    <div className="text-xs text-neutral-500 dark:text-muted-foreground mt-1">
                                                        Collected by: {recipient.collected_by}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                {recipient.collected ? (
                                                    <Badge variant="success">Collected</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Pending</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
