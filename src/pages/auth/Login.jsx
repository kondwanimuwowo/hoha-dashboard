import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ModeToggle } from '@/components/shared/ModeToggle'

export function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn, user, resetPassword } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from
    const destination = from
        ? `${from.pathname || ''}${from.search || ''}${from.hash || ''}`
        : '/'

    useEffect(() => {
        if (user) {
            navigate(destination, { replace: true })
        }
    }, [destination, navigate, user])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error: signInError } = await signIn(email, password)

        if (signInError) {
            setError(signInError.message)
            setLoading(false)
        } else {
            navigate(destination, { replace: true })
        }
    }

    if (user) return null

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="absolute right-4 top-4">
                <ModeToggle />
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white">
                        <span className="text-3xl font-bold">H</span>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome to HOHA</CardTitle>
                    <CardDescription>
                        Sign in to access the dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        <button
                            type="button"
                            className="text-primary-600 hover:underline dark:text-primary-400"
                            onClick={async () => {
                                if (!email) {
                                    setError('Enter your email first, then click Forgot password.')
                                    return
                                }

                                const { error: resetError } = await resetPassword(email)
                                if (resetError) {
                                    setError(resetError.message)
                                    return
                                }

                                toast.success('Password reset link sent. Check your email.')
                            }}
                        >
                            Forgot password?
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
