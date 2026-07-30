import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/services/api/auth'
import { getDashboardStats, getReadinessStats } from '@/services/api/dashboard'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { ProfileSkeleton } from '@/components/common/Skeleton'
import { ErrorState } from '@/components/common/ErrorState'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  
  const [stats, setStats] = useState({
    problems_solved: 0,
    goals_completed: 0,
    companies_applied: 0,
    current_streak: 0,
    placement_readiness_index: 0
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [userRes, dashboardRes, readinessRes] = await Promise.all([
        authApi.getMe(),
        getDashboardStats(),
        getReadinessStats()
      ])

      const userData = userRes.data
      setUser(userData)
      
      setStats({
        problems_solved: dashboardRes.stats?.problems_solved || 0,
        goals_completed: 0, // Calculate later or mock as completed
        companies_applied: dashboardRes.stats?.companies_tracked || 0,
        current_streak: dashboardRes.stats?.current_streak || 0,
        placement_readiness_index: readinessRes.placement_readiness_index || 0
      })
    } catch (err) {
      console.error('Failed to load profile details', err)
      setError('Unable to load profile information. Please verify database connection.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (error || !user) {
    return (
      <ErrorState 
        title="Load Profile Error"
        description={error || "Profile is unavailable."}
        onRetry={loadData}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 select-none">
          <User className="w-6 h-6 text-text-primary" />
          User Profile
        </h1>
        <p className="text-text-secondary text-xs">
          View your preparation metrics and academic details
        </p>
      </div>

      {/* Main Profile Info Card */}
      <ProfileCard user={user} stats={stats} />
    </motion.div>
  )
}
