import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sliders, 
  User, 
  Bell, 
  Settings as Gear, 
  ShieldAlert, 
  KeyRound, 
  Download, 
  Trash2,
  Loader,
  Check,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop,
  Palette
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useToastStore } from '@/store/toast.store'
import { useThemeStore } from '@/store/theme.store'
import { authApi } from '@/services/api/auth'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SettingsSkeleton } from '@/components/common/Skeleton'

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore()
  const { addToast } = useToastStore()
  const { theme: activeThemeMode, resolvedTheme, setTheme: setAppTheme } = useThemeStore()

  // Local Form state
  const [fullName, setFullName] = useState('')
  const [college, setCollege] = useState('')
  const [branch, setBranch] = useState('')
  const [gradYear, setGradYear] = useState('')
  const [prefLanguage, setPrefLanguage] = useState('')
  const [targetRole, setTargetRole] = useState('')
  
  // Preferences State
  const [dailyReminder, setDailyReminder] = useState(false)
  const [deadlineAlerts, setDeadlineAlerts] = useState(false)

  // Autosave Status
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false)

  // Danger Zone Dialog State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  const [isLoading, setIsLoading] = useState(true)

  // Initialize fields
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setCollege(user.college || '')
      setBranch(user.branch || '')
      setGradYear(user.grad_year?.toString() || '')
      setPrefLanguage(user.preferred_language || '')
      setTargetRole(user.target_role || '')
      
      const prefs = user.preferences || {}
      setDailyReminder(prefs.dailyReminder ?? false)
      setDeadlineAlerts(prefs.deadlineAlerts ?? false)
      
      setIsLoading(false)
    }
  }, [user])

  // Trigger debounced autosave
  const triggerAutosave = (fields: Record<string, any>) => {
    setSavingStatus('saving')
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = { ...fields }
        if (fields.grad_year) {
          payload.grad_year = parseInt(fields.grad_year, 10) || null
        }
        const res = await authApi.updateProfile(payload)
        const updated = (res as any).data?.user || (res as any).user || (res as any).data || res
        setUser(updated)
        setSavingStatus('saved')
        setTimeout(() => setSavingStatus('idle'), 2000)
      } catch {
        setSavingStatus('idle')
        addToast('Autosave synchronization encountered an issue.', 'warning')
      }
    }, 800)
  }

  // Handle manual input changes
  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'fullName':
        setFullName(value)
        triggerAutosave({ full_name: value })
        break
      case 'college':
        setCollege(value)
        triggerAutosave({ college: value })
        break
      case 'branch':
        setBranch(value)
        triggerAutosave({ branch: value })
        break
      case 'gradYear':
        setGradYear(value)
        triggerAutosave({ grad_year: value })
        break
      case 'prefLanguage':
        setPrefLanguage(value)
        triggerAutosave({ preferred_language: value })
        break
      case 'targetRole':
        setTargetRole(value)
        triggerAutosave({ target_role: value })
        break
    }
  }

  // Handle preferences toggle
  const handlePreferenceToggle = (prefField: string, value: boolean | string) => {
    const updatedPrefs = {
      ...(user?.preferences || {}),
      [prefField]: value
    }
    
    if (prefField === 'dailyReminder') setDailyReminder(value as boolean)
    if (prefField === 'deadlineAlerts') setDeadlineAlerts(value as boolean)

    triggerAutosave({ preferences: updatedPrefs })
  }

  // Handle password update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPasswordUpdating(true)
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword })
      addToast('Password updated successfully.', 'success')
      setIsPasswordModalOpen(false)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Password update failed. Try again.'
      addToast(errMsg, 'error')
    } finally {
      setIsPasswordUpdating(false)
    }
  }

  // Export Data JSON download
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const res = await authApi.exportData()
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `trap_export_${user?.full_name?.toLowerCase().replace(/\s+/g, '_')}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      addToast('Data exported successfully.', 'success')
    } catch {
      addToast('Failed to export data.', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // Delete Account Confirm
  const handleDeleteAccountConfirm = async () => {
    setIsDeletingAccount(true)
    try {
      await authApi.deleteAccount()
      addToast('Your account was permanently deleted.', 'success')
      setIsDeleteConfirmOpen(false)
      logout()
    } catch {
      addToast('Failed to delete account.', 'error')
      setIsDeletingAccount(false)
    }
  }

  if (isLoading) {
    return <SettingsSkeleton />
  }

  const labelClasses = "text-xs font-mono font-bold text-text-secondary uppercase tracking-wider block mb-2"
  const inputClasses = "w-full bg-bg-container-low border border-border-default rounded px-3.5 py-2 text-sm text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-16 max-w-4xl mx-auto"
    >
      {/* Header and Saving status */}
      <div className="flex items-center justify-between border-b border-border-default pb-4 select-none">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Sliders className="w-6 h-6 text-text-primary" />
            Settings
          </h1>
          <p className="text-text-secondary text-xs">
            Manage your account configurations and profile attributes
          </p>
        </div>

        {/* Autosave status pill */}
        <div className="text-xs font-mono shrink-0">
          {savingStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Loader className="w-3.5 h-3.5 animate-spin" />
              AUTOSAVING...
            </span>
          )}
          {savingStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-success font-bold">
              <Check className="w-3.5 h-3.5" />
              CHANGES SAVED
            </span>
          )}
        </div>
      </div>

      {/* ── Section 1: Profile Information ───────────────────────── */}
      <div className="bg-bg-surface border border-border-default rounded-md p-6 space-y-6 shadow-sm relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
        <h2 className="text-xs font-mono font-bold text-primary uppercase tracking-widest flex items-center gap-2 select-none border-b border-border-default border-dashed pb-3 mt-1">
          <User className="w-4 h-4 text-text-secondary" />
          Profile Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Display Name */}
          <div className="space-y-1">
            <label className={labelClasses}>Display Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => handleInputChange('fullName', e.target.value)}
              className={inputClasses}
              placeholder="Your full name"
            />
          </div>

          {/* Target Role */}
          <div className="space-y-1">
            <label className={labelClasses}>Target Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={e => handleInputChange('targetRole', e.target.value)}
              className={inputClasses}
              placeholder="e.g. SDE-1, Backend Engineer"
            />
          </div>

          {/* College */}
          <div className="space-y-1">
            <label className={labelClasses}>College / University</label>
            <input
              type="text"
              value={college}
              onChange={e => handleInputChange('college', e.target.value)}
              className={inputClasses}
              placeholder="Your college name"
            />
          </div>

          {/* Branch */}
          <div className="space-y-1">
            <label className={labelClasses}>Branch / Major</label>
            <input
              type="text"
              value={branch}
              onChange={e => handleInputChange('branch', e.target.value)}
              className={inputClasses}
              placeholder="e.g. Computer Science"
            />
          </div>

          {/* Graduation Year */}
          <div className="space-y-1">
            <label className={labelClasses}>Graduation Year</label>
            <input
              type="number"
              value={gradYear}
              onChange={e => handleInputChange('gradYear', e.target.value)}
              className={inputClasses}
              placeholder="YYYY"
            />
          </div>

          {/* Preferred Language */}
          <div className="space-y-1">
            <label className={labelClasses}>Preferred Language</label>
            <select
              value={prefLanguage}
              onChange={e => handleInputChange('prefLanguage', e.target.value)}
              className={`${inputClasses} cursor-pointer font-bold`}
            >
              <option value="">Select Language</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 2: Appearance ─────────────────────────────────── */}
      <div className="bg-bg-surface border border-border-default rounded-md p-6 space-y-6 shadow-sm relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
        <div className="flex items-center justify-between border-b border-border-default border-dashed pb-3 mt-1 select-none">
          <h2 className="text-xs font-mono font-bold text-primary uppercase tracking-widest flex items-center gap-2">
            <Palette className="w-4 h-4 text-text-secondary" />
            Appearance
          </h2>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-tertiary">
            Active: {activeThemeMode.toUpperCase()} ({resolvedTheme.toUpperCase()})
          </span>
        </div>

        <p className="text-xs text-text-secondary">
          Customize your application interface visual theme. Your choice persists across page refreshes, browser restarts, and authentication sessions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Light Mode Option */}
          <button
            type="button"
            onClick={() => {
              setAppTheme('light')
              handlePreferenceToggle('theme', 'light')
              addToast('Theme set to Light Mode', 'info')
            }}
            className={`p-4 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              activeThemeMode === 'light'
                ? 'border-primary ring-1 ring-primary bg-bg-container-low'
                : 'border-border-default bg-bg-container-low/30 hover:border-border-strong hover:bg-bg-container-low'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded bg-bg-container-high flex items-center justify-center text-primary">
                <Sun className="w-4 h-4" />
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                activeThemeMode === 'light' ? 'border-primary bg-primary' : 'border-border-default'
              }`}>
                {activeThemeMode === 'light' && <div className="w-1.5 h-1.5 rounded-full bg-text-inverse" />}
              </div>
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-primary uppercase block">Light</span>
              <span className="text-[11px] text-text-secondary mt-0.5 block leading-snug">Clean, bright, minimal surfaces</span>
            </div>
          </button>

          {/* Dark Mode Option */}
          <button
            type="button"
            onClick={() => {
              setAppTheme('dark')
              handlePreferenceToggle('theme', 'dark')
              addToast('Theme set to Dark Mode', 'info')
            }}
            className={`p-4 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              activeThemeMode === 'dark'
                ? 'border-primary ring-1 ring-primary bg-bg-container-low'
                : 'border-border-default bg-bg-container-low/30 hover:border-border-strong hover:bg-bg-container-low'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded bg-bg-container-high flex items-center justify-center text-primary">
                <Moon className="w-4 h-4" />
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                activeThemeMode === 'dark' ? 'border-primary bg-primary' : 'border-border-default'
              }`}>
                {activeThemeMode === 'dark' && <div className="w-1.5 h-1.5 rounded-full bg-text-inverse" />}
              </div>
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-primary uppercase block">Dark</span>
              <span className="text-[11px] text-text-secondary mt-0.5 block leading-snug">Deep, high-contrast, Nothing-inspired</span>
            </div>
          </button>

          {/* System Mode Option */}
          <button
            type="button"
            onClick={() => {
              setAppTheme('system')
              handlePreferenceToggle('theme', 'system')
              addToast('Theme set to System Default', 'info')
            }}
            className={`p-4 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              activeThemeMode === 'system'
                ? 'border-primary ring-1 ring-primary bg-bg-container-low'
                : 'border-border-default bg-bg-container-low/30 hover:border-border-strong hover:bg-bg-container-low'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded bg-bg-container-high flex items-center justify-center text-primary">
                <Laptop className="w-4 h-4" />
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                activeThemeMode === 'system' ? 'border-primary bg-primary' : 'border-border-default'
              }`}>
                {activeThemeMode === 'system' && <div className="w-1.5 h-1.5 rounded-full bg-text-inverse" />}
              </div>
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-primary uppercase block">System</span>
              <span className="text-[11px] text-text-secondary mt-0.5 block leading-snug">Adapts to OS color scheme</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Section 3: Preferences ───────────────────────────────── */}
      <div className="bg-bg-surface border border-border-default rounded-md p-6 space-y-6 shadow-sm relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
        <h2 className="text-xs font-mono font-bold text-primary uppercase tracking-widest flex items-center gap-2 select-none border-b border-border-default border-dashed pb-3 mt-1">
          <Bell className="w-4 h-4 text-text-secondary" />
          Preferences & Toggles
        </h2>

        <div className="space-y-4">
          {/* Daily Reminders Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-border-default border-dashed last:border-b-0">
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-primary uppercase">Daily Preparation Email Reminders</span>
              <p className="text-[11px] text-text-secondary">Get a daily digest alert of your active preparation goals</p>
            </div>
            <input
              type="checkbox"
              checked={dailyReminder}
              onChange={e => handlePreferenceToggle('dailyReminder', e.target.checked)}
              className="w-4.5 h-4.5 rounded border-border-default bg-bg-container-low text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          {/* Deadline Alerts Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-border-default border-dashed last:border-b-0">
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-primary uppercase">Goal Deadline Warnings</span>
              <p className="text-[11px] text-text-secondary">Warn me 48 hours before an active roadmap goal is set to expire</p>
            </div>
            <input
              type="checkbox"
              checked={deadlineAlerts}
              onChange={e => handlePreferenceToggle('deadlineAlerts', e.target.checked)}
              className="w-4.5 h-4.5 rounded border-border-default bg-bg-container-low text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── Section 4: Account & Security ─────────────────────────── */}
      <div className="bg-bg-surface border border-border-default rounded-md p-6 space-y-6 shadow-sm relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
        <h2 className="text-xs font-mono font-bold text-primary uppercase tracking-widest flex items-center gap-2 select-none border-b border-border-default border-dashed pb-3 mt-1">
          <Gear className="w-4 h-4 text-text-secondary" />
          Account & Security
        </h2>

        <div>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg-container-low border border-border-default hover:bg-bg-container-high text-primary rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-none"
          >
            <KeyRound className="w-4 h-4" />
            Update Password
          </button>
        </div>
      </div>

      {/* ── Section 4: Danger Zone ────────────────────────────────── */}
      <div className="border border-secondary/25 bg-secondary/5 rounded-md p-6 space-y-6 shadow-sm select-none relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary/15 rounded-t-md dot-matrix-strip"></div>
        <h2 className="text-xs font-mono font-bold text-secondary uppercase tracking-widest flex items-center gap-2 border-b border-secondary/15 pb-3 mt-1">
          <ShieldAlert className="w-4.5 h-4.5" />
          Danger Zone
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-primary uppercase block">Export Account Data</span>
            <p className="text-[11px] text-text-secondary leading-relaxed max-w-lg">
              Download all your prep data (problems, companies, goals, details) in a single structured JSON file.
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg-container-low border border-border-default hover:bg-bg-container-high text-primary rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-none"
          >
            {isExporting ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export JSON
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4 border-t border-border-default border-dashed">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-secondary uppercase block">Delete User Account</span>
            <p className="text-[11px] text-text-secondary leading-relaxed max-w-lg">
              Permanently drop your account. All statistics, goals, applications, and logs will be deleted. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white hover:bg-secondary/95 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-none"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-bg-overlay border border-border-default rounded-md p-6 shadow-md overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
              <div className="mb-4 mt-1 border-b border-border-default border-dashed pb-3">
                <h3 className="text-sm font-bold font-mono text-primary uppercase tracking-wide">Update Account Password</h3>
                <p className="text-[11px] text-text-secondary mt-1">Please enter your credentials to update the password</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelClasses}>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className={inputClasses}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClasses}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className={inputClasses}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 bg-bg-container-low border border-border-default text-text-secondary hover:text-primary text-xs font-mono font-bold uppercase rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPasswordUpdating}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-text-inverse text-xs font-mono font-bold uppercase rounded cursor-pointer flex items-center gap-1.5"
                  >
                    {isPasswordUpdating && <Loader className="w-3.5 h-3.5 animate-spin" />}
                    Save Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Delete Universal Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAccountConfirm}
        title="Delete User Account"
        message="Are you sure you want to permanently delete your TRAP account? This will cascade-delete all problems, company applications, Streaks, PRI metrics, and roadmap goals. This action is absolute and cannot be undone."
        confirmText="Confirm Delete Account"
        isDangerous
        isLoading={isDeletingAccount}
      />
    </motion.div>
  )
}
