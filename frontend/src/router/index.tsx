import { createBrowserRouter, Navigate } from 'react-router-dom'

// Layouts
import { RootLayout } from '@/layouts/RootLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'

// Guards
import { GuestGuard } from './guards/GuestGuard'
import { AuthGuard } from './guards/AuthGuard'

// Pages
import { LoginPage } from '@/pages/public/LoginPage'
import { RegisterPage } from '@/pages/public/RegisterPage'
import { LandingPage } from '@/pages/public/LandingPage'
import DashboardPage from '@/pages/app/DashboardPage'
import ProblemsPage from '@/pages/app/ProblemsPage'
import CompaniesPage from '@/pages/app/CompaniesPage'
import GoalsPage from '@/pages/app/goals/GoalsPage'
import GoalBuilder from '@/pages/app/goals/builder/GoalBuilder'
import GoalView from '@/pages/app/goals/GoalView'
import ProfilePage from '@/pages/app/ProfilePage'
import SettingsPage from '@/pages/app/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <GuestGuard>
            <LandingPage />
          </GuestGuard>
        )
      },
      {
        // Public/Auth routes
        element: (
          <GuestGuard>
            <AuthLayout />
          </GuestGuard>
        ),
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      {
        // Protected App routes
        path: 'app',
        element: (
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'problems', element: <ProblemsPage /> },
          { path: 'companies', element: <CompaniesPage /> },
          { path: 'goals', element: <GoalsPage /> },
          { path: 'goals/new', element: <GoalBuilder /> },
          { path: 'goals/:id', element: <GoalView /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
      {
        // Catch-all
        path: '*',
        element: <Navigate to="/login" replace />,
      }
    ],
  },
])
