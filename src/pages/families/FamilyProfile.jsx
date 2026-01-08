import { useParams, useNavigate } from 'react-router-dom'
import { usePerson } from '@/hooks/usePeople'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { FamilyMemberCard } from '@/components/family/FamilyMemberCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, MapPin, Users, Phone } from 'lucide-react'
import { motion } from 'framer-motion'

export function FamilyProfile() {
    const { id } = useParams() // This is the Head of Household ID
    const navigate = useNavigate()

    const { data: head, isLoading } = usePerson(id)

    if (isLoading) return <LoadingSpinner />

    if (!head) {
        return (
            <div className="p-8 text-center">
                <Alert variant="destructive" className="max-w-md mx-auto">
                    <AlertDescription>Family not found</AlertDescription>
                </Alert>
                <Button variant="link" onClick={() => navigate(-1)} className="mt-4">
                    Go Back
                </Button>
            </div>
        )
    }

    // The family members come from the `family_members` relation in the usePerson query
    const members = head.family_members || []
    // Include the head in the total count/list logic if needed, 
    // but usually we want to show Head separate or at top.

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <PageHeader
                    title={`The ${head.last_name} Family`}
                    description={`Household ID: ${head.id.slice(0, 8)}`}
                />
            </div>

            {/* Household Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-neutral-500" />
                        Household Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-neutral-400 mt-0.5" />
                        <div>
                            <div className="text-sm font-medium text-neutral-500">Location</div>
                            <div className="font-semibold text-neutral-900">{head.compound_area || 'Not recorded'}</div>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-neutral-400 mt-0.5" />
                        <div>
                            <div className="text-sm font-medium text-neutral-500">Contact</div>
                            <div className="font-semibold text-neutral-900">{head.phone_number || 'No phone'}</div>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-neutral-400 mt-0.5" />
                        <div>
                            <div className="text-sm font-medium text-neutral-500">Family Size</div>
                            <div className="font-semibold text-neutral-900">{members.length + 1} Members</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Family Members Grid */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900 px-1">Family Members</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Head of Household */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <FamilyMemberCard member={head} isHead={true} />
                    </motion.div>

                    {/* Other Members */}
                    {members.map((member, index) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: (index + 1) * 0.1 }}
                        >
                            <FamilyMemberCard member={member} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
