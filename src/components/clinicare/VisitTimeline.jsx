import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Stethoscope, AlertCircle, FileText, Calendar } from 'lucide-react'

export function VisitTimeline({ visits }) {
    if (!visits || visits.length === 0) {
        return (
            <div className="text-center py-12 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No medical visits recorded for this patient.
            </div>
        )
    }

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
            {visits.map((visit, index) => (
                <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {visit.is_emergency ? (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                        )}
                    </div>

                    {/* Content Card */}
                    <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-lg text-neutral-900">
                                    {visit.diagnosis || 'General Checkup'}
                                </div>
                                <time className="text-sm font-medium text-neutral-500">
                                    {formatDate(visit.visit_date)}
                                </time>
                            </div>

                            <div className="flex flex-wrap gap-2 my-2">
                                <Badge variant={visit.is_emergency ? "destructive" : "secondary"}>
                                    {visit.is_emergency ? 'Emergency' : 'Routine'}
                                </Badge>
                                <Badge variant="outline">
                                    {formatCurrency(visit.cost_amount || 0)}
                                </Badge>
                                {visit.follow_up_required && (
                                    <Badge variant="warning" className="bg-orange-100 text-orange-800 border-orange-200">
                                        Follow-up: {visit.follow_up_date ? formatDate(visit.follow_up_date) : 'Pending'}
                                    </Badge>
                                )}
                            </div>

                            <div className="text-sm text-neutral-600">
                                <span className="font-medium text-neutral-900">Treatment: </span>
                                {visit.treatment_provided || 'No treatment recorded'}
                            </div>



                            {visit.notes && (
                                <div className="mt-2 text-sm text-neutral-500 bg-neutral-50 p-2 rounded border border-neutral-100 italic">
                                    "{visit.notes}"
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}

