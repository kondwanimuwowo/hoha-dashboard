import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { Toaster } from 'sonner'

const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))

const EducareOverview = lazy(() => import('@/pages/educare/EducareOverview').then((m) => ({ default: m.EducareOverview })))
const Students = lazy(() => import('@/pages/educare/Students').then((m) => ({ default: m.Students })))
const StudentProfile = lazy(() => import('@/pages/educare/StudentProfile').then((m) => ({ default: m.StudentProfile })))
const Attendance = lazy(() => import('@/pages/educare/Attendance').then((m) => ({ default: m.Attendance })))
const SchoolAwards = lazy(() => import('@/pages/educare/SchoolAwards').then((m) => ({ default: m.SchoolAwards })))

const LegacyOverview = lazy(() => import('@/pages/legacy/LegacyOverview').then((m) => ({ default: m.LegacyOverview })))
const Participants = lazy(() => import('@/pages/legacy/Participants').then((m) => ({ default: m.Participants })))
const WomanProfile = lazy(() => import('@/pages/legacy/WomanProfile').then((m) => ({ default: m.WomanProfile })))
const LegacyAttendance = lazy(() => import('@/pages/legacy/LegacyAttendance').then((m) => ({ default: m.LegacyAttendance })))

const ClinicareOverview = lazy(() => import('@/pages/clinicare/ClinicareOverview').then((m) => ({ default: m.ClinicareOverview })))
const Visits = lazy(() => import('@/pages/clinicare/Visits').then((m) => ({ default: m.Visits })))
const PatientHistory = lazy(() => import('@/pages/clinicare/PatientHistory').then((m) => ({ default: m.PatientHistory })))
const Facilities = lazy(() => import('@/pages/clinicare/Facilities').then((m) => ({ default: m.Facilities })))

const FoodOverview = lazy(() => import('@/pages/food/FoodOverview').then((m) => ({ default: m.FoodOverview })))
const Distributions = lazy(() => import('@/pages/food/Distributions').then((m) => ({ default: m.Distributions })))
const DistributionDetail = lazy(() => import('@/pages/food/DistributionDetail').then((m) => ({ default: m.DistributionDetail })))
const FoodHistory = lazy(() => import('@/pages/food/FoodHistory').then((m) => ({ default: m.FoodHistory })))

const EmergencyReliefOverview = lazy(() => import('@/pages/emergency-relief/EmergencyReliefOverview'))
const ReliefHistory = lazy(() => import('@/pages/emergency-relief/ReliefHistory').then((m) => ({ default: m.ReliefHistory })))

const CommunityOutreachOverview = lazy(() => import('@/pages/community-outreach/CommunityOutreachOverview').then((m) => ({ default: m.CommunityOutreachOverview })))
const OutreachDetail = lazy(() => import('@/pages/community-outreach/OutreachDetail').then((m) => ({ default: m.OutreachDetail })))

const FamilyProfile = lazy(() => import('@/pages/families/FamilyProfile').then((m) => ({ default: m.FamilyProfile })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const UserManagement = lazy(() => import('@/pages/admin/UserManagement').then((m) => ({ default: m.UserManagement })))
const Reports = lazy(() => import('@/pages/reports/Reports').then((m) => ({ default: m.Reports })))
const MaintenanceMode = lazy(() => import('@/pages/MaintenanceMode').then((m) => ({ default: m.MaintenanceMode })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

import { useMaintenanceMode } from '@/hooks/useMaintenanceMode'

function RouteLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { isAdmin, loading, user } = useAuth()
  const { isMaintenanceMode } = useMaintenanceMode()

  // If maintenance mode is on and user is NOT an admin, show maintenance page
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isMaintenanceMode && user && !isAdmin) {
    return <MaintenanceMode />
  }

  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="educare">
              <Route index element={<EducareOverview />} />
              <Route path="students" element={<Students />} />
              <Route path="students/:id" element={<StudentProfile />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="awards" element={<SchoolAwards />} />
            </Route>

            <Route path="legacy">
              <Route index element={<LegacyOverview />} />
              <Route path="participants" element={<Participants />} />
              <Route path="participants/:id" element={<WomanProfile />} />
              <Route path="attendance" element={<LegacyAttendance />} />
            </Route>

            <Route path="clinicare">
              <Route index element={<ClinicareOverview />} />
              <Route path="visits" element={<Visits />} />
              <Route path="patients/:id" element={<PatientHistory />} />
              <Route path="facilities" element={<Facilities />} />
            </Route>

            <Route path="food">
              <Route index element={<FoodOverview />} />
              <Route path="distributions" element={<Distributions />} />
              <Route path="distributions/:id" element={<DistributionDetail />} />
              <Route path="history" element={<FoodHistory />} />
            </Route>

            <Route path="emergency-relief">
              <Route index element={<EmergencyReliefOverview />} />
              <Route path="history" element={<ReliefHistory />} />
            </Route>

            <Route path="community-outreach">
              <Route index element={<CommunityOutreachOverview />} />
              <Route path=":id" element={<OutreachDetail />} />
            </Route>

            <Route path="families/:id" element={<FamilyProfile />} />
            <Route path="settings" element={<Settings />} />

            <Route path="admin">
              <Route
                path="users"
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                }
              />
            </Route>

            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Route>

        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}

export default App
