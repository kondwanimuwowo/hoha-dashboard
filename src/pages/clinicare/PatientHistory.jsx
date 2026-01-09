import { useParams, useNavigate } from 'react-router-dom'
import { usePerson } from '@/hooks/usePeople'
import { usePatientVisits } from '@/hooks/useVisits'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { PatientSummary } from '@/components/clinicare/PatientSummary'
import { VisitTimeline } from '@/components/clinicare/VisitTimeline'
import { Button } from '@/components/ui/button'
import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Phone, MapPin, Calendar, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function PatientHistory() {
    const { id } = useParams()
    const navigate = useNavigate()

    const { data: patient, isLoading: patientLoading } = usePerson(id)
    const { data: history, isLoading: historyLoading } = usePatientVisits(id)

    if (patientLoading || historyLoading) return <LoadingSpinner />

    if (!patient) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-neutral-900">Patient Not Found</h2>
                <Button variant="link" onClick={() => navigate('/clinicare')}>Back to Clinicare</Button>
            </div>
        )
    }

    const visits = history?.visits || []
    const summary = history?.summary

    return (
        <div className="space-y-8">
            {/* Header with Patient Profile */}
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white p-6 rounded-xl border shadow-sm">
                    <PersonAvatar
                        photoUrl={patient.photo_url}
                        gender={patient.gender}
                        firstName={patient.first_name}
                        lastName={patient.last_name}
                        className="h-20 w-20 border-4 border-white shadow-md"
                    />

                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-neutral-900">
                                {patient.first_name} {patient.last_name}
                            </h1>
                            <Badge variant={patient.is_active ? 'success' : 'secondary'}>
                                {patient.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mt-2">
                            <div className="flex items-center gap-1.5">
                                <User className="h-4 w-4 opacity-70" />
                                <span>{patient.gender || 'Unknown'} • {patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years` : 'Age unknown'}</span>
                            </div>
                            {patient.phone_number && (
                                <div className="flex items-center gap-1.5">
                                    <Phone className="h-4 w-4 opacity-70" />
                                    <span>{patient.phone_number}</span>
                                </div>
                            )}
                            {patient.compound_area && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 opacity-70" />
                                    <span>{patient.compound_area}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => navigate(`/clinicare/visits/new?patientId=${id}`)}>
                            Record New Visit
                        </Button>
                        {patient.family_head_id && (
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/families/${patient.family_head_id}`)}
                            >
                                View Family
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">Medical History Summary</h3>
                <PatientSummary summary={summary} />
            </div>

            {/* Visit Timeline */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">Visit Timeline</h3>
                <VisitTimeline visits={visits} />
            </div>
        </div>
    )
}
