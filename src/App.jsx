import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ThemeProvider } from '@/components/shared/ThemeProvider'

// Auth pages
import { Login } from '@/pages/auth/Login'

// Main dashboard
import { Dashboard } from '@/pages/Dashboard'

// Educare Africa pages
import { EducareOverview } from '@/pages/educare/EducareOverview'
import { Students } from '@/pages/educare/Students'
import { StudentProfile } from '@/pages/educare/StudentProfile'
import { Attendance } from '@/pages/educare/Attendance'

// Legacy Women's Program pages
import { LegacyOverview } from '@/pages/legacy/LegacyOverview'
import { Participants } from '@/pages/legacy/Participants'
import { WomanProfile } from '@/pages/legacy/WomanProfile'
import { LegacyAttendance } from '@/pages/legacy/LegacyAttendance'

// Clinicare Africa pages
import { ClinicareOverview } from '@/pages/clinicare/ClinicareOverview'
import { Visits } from '@/pages/clinicare/Visits'
import { PatientHistory } from '@/pages/clinicare/PatientHistory'
import { Facilities } from '@/pages/clinicare/Facilities'

// Food Distribution pages
import { FoodOverview } from '@/pages/food/FoodOverview'
import { Distributions } from '@/pages/food/Distributions'
import { DistributionDetail } from '@/pages/food/DistributionDetail'
import { FoodHistory } from '@/pages/food/FoodHistory'

// Emergency Relief pages
import EmergencyReliefOverview from '@/pages/emergency-relief/EmergencyReliefOverview'
import { ReliefHistory } from '@/pages/emergency-relief/ReliefHistory'

// Family pages
import { FamilyProfile } from '@/pages/families/FamilyProfile'

import { Settings } from '@/pages/Settings'

// Admin pages
import { UserManagement } from '@/pages/admin/UserManagement'

// Reports
import { Reports } from '@/pages/reports/Reports'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Main Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Educare Africa Routes */}
          <Route path="educare">
            <Route index element={<EducareOverview />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="attendance" element={<Attendance />} />
          </Route>

          {/* Legacy Women's Program Routes */}
          <Route path="legacy">
            <Route index element={<LegacyOverview />} />
            <Route path="participants" element={<Participants />} />
            <Route path="participants/:id" element={<WomanProfile />} />
            <Route path="attendance" element={<LegacyAttendance />} />
          </Route>



          {/* Clinicare Africa Routes */}
          <Route path="clinicare">
            <Route index element={<ClinicareOverview />} />
            <Route path="visits" element={<Visits />} />
            <Route path="patients/:id" element={<PatientHistory />} />
            <Route path="facilities" element={<Facilities />} />
          </Route>

          {/* Food Distribution Routes */}
          <Route path="food">
            <Route index element={<FoodOverview />} />
            <Route path="distributions" element={<Distributions />} />
            <Route path="distributions/:id" element={<DistributionDetail />} />
            <Route path="history" element={<FoodHistory />} />
          </Route>

          {/* Emergency Relief Routes */}
          <Route path="emergency-relief">
            <Route index element={<EmergencyReliefOverview />} />
            <Route path="history" element={<ReliefHistory />} />
          </Route>

          {/* Family Routes */}
          <Route path="families/:id" element={<FamilyProfile />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />

          {/* Admin Routes */}
          <Route path="admin">
            <Route path="users" element={<UserManagement />} />
          </Route>

          {/* Reports */}
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App