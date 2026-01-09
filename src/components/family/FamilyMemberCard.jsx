import { PersonAvatar } from '@/components/shared/PersonAvatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { User, Phone, GraduationCap, Heart, Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'

export function FamilyMemberCard({ member, isHead = false }) {
    const age = member.date_of_birth
        ? new Date().getFullYear() - new Date(member.date_of_birth).getFullYear()
        : '?'

    return (
        <Card className={`relative group transition-all hover:shadow-md ${isHead ? 'border-primary-200 bg-primary-50/10' : ''}`}>
            {isHead && (
                <div className="absolute top-2 right-2">
                    <Badge variant="default">Head of Household</Badge>
                </div>
            )}
            <CardContent className="p-4 flex items-start space-x-4">
                <PersonAvatar
                    photoUrl={member.photo_url}
                    gender={member.gender}
                    firstName={member.first_name}
                    lastName={member.last_name}
                    className="h-16 w-16 border-2 border-white shadow-sm"
                />

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <Link
                            to={`/clinicare/patients/${member.id}`}
                            className="font-semibold text-lg text-neutral-900 hover:text-primary-600 hover:underline"
                        >
                            {member.first_name} {member.last_name}
                        </Link>
                    </div>

                    <div className="text-sm text-neutral-600 flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{member.gender || 'Unknown'} • {age} years</span>
                    </div>

                    {member.phone_number && (
                        <div className="text-sm text-neutral-600 flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone_number}</span>
                        </div>
                    )}

                    {/* Program Badges (Mock logic for now as we don't have this data joined yet) */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {age < 18 && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                <GraduationCap className="h-3 w-3 mr-1" />
                                Educare Eligible
                            </Badge>
                        )}
                        {member.gender === 'Female' && age > 18 && (
                            <Badge variant="outline" className="text-pink-600 border-pink-200 bg-pink-50">
                                <Briefcase className="h-3 w-3 mr-1" />
                                Legacy Eligible
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                            <Heart className="h-3 w-3 mr-1" />
                            Clinicare
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
