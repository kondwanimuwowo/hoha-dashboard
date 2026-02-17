import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Compass } from 'lucide-react'

export function NotFound() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const path = location.pathname || '/'

    return (
        <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden rounded-3xl border bg-gradient-to-br from-primary-50 via-background to-accent-50 px-4 py-12 dark:from-primary-900/20 dark:via-background dark:to-accent-900/10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_50%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_45%)]" />
            <Card className="relative w-full max-w-2xl border border-white/60 bg-white/90 shadow-xl backdrop-blur dark:border-white/10 dark:bg-card/80">
                <CardContent className="p-8 sm:p-10">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-700 dark:text-primary-300">
                            <Compass className="h-7 w-7" />
                        </div>
                        <div className="text-6xl font-bold tracking-tight text-primary-700 dark:text-primary-300">
                            404
                        </div>
                        <h1 className="mt-3 text-2xl font-semibold text-foreground">
                            Page not found
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            The page you are looking for does not exist or was moved.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                            <span>Requested:</span>
                            <Badge variant="outline" className="bg-background/70 font-mono text-xs">
                                {path}
                            </Badge>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <Button variant="outline" onClick={() => navigate(-1)}>
                                <ArrowLeft className="h-4 w-4" />
                                Go back
                            </Button>
                            <Button onClick={() => navigate(user ? '/' : '/login')}>
                                {user ? 'Go to dashboard' : 'Go to login'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
