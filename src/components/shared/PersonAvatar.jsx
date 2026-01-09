import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getProfilePlaceholder } from '@/lib/utils'

const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL

export function PersonAvatar({ photoUrl, gender, firstName, lastName, className = "h-10 w-10" }) {
    const fullPhotoUrl = photoUrl
        ? (photoUrl.startsWith('http')
            ? photoUrl
            : `${SUPABASE_PROJECT_URL}/storage/v1/object/public/photos/${photoUrl}`)
        : getProfilePlaceholder(gender)

    const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`

    return (
        <Avatar className={className}>
            <AvatarImage src={fullPhotoUrl} alt={`${firstName} ${lastName}`} />
            <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
    )
}
