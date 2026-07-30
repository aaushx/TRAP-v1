import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/store/auth.store'
import { useToastStore } from '@/store/toast.store'
import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()
  const setTokens = useAuthStore((state) => state.setTokens)
  const { addToast } = useToastStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await authApi.register({ email, password, full_name: fullName })
      const tokens = response.data.tokens
      const user = response.data.user
      setTokens(tokens.access_token, tokens.refresh_token, user)
      addToast('Account created successfully!', 'success')
      navigate('/app/dashboard', { replace: true })
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Registration failed. Please try again.'
      setError(errMsg)
      addToast(errMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto"
    >
      {/* Register Card */}
      <div className="bg-white border border-border-default rounded-md p-8 md:p-12 relative flex flex-col gap-8 shadow-sm hover:border-primary transition-colors duration-300 group">
        {/* Header Strip (Design System Detail) */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-bg-container-high rounded-t-md dot-matrix-strip opacity-20"></div>
        
        {/* Header */}
        <div className="text-center space-y-2 mt-2">
          <div className="flex justify-center mb-4 select-none">
            <img src="/logo.jpg" alt="TRA.P Logo" className="w-12 h-12 rounded" />
          </div>
          <h1 className="font-display font-bold text-2xl text-primary tracking-tighter uppercase">TRA.P</h1>
          <p className="font-sans text-xs text-text-secondary uppercase tracking-widest">Enrollment Panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">
          {error && (
            <div className="rounded border border-secondary/20 bg-secondary/5 p-3 text-xs text-secondary font-mono">
              {error}
            </div>
          )}

          {/* Full Name Input */}
          <div className="relative group/input z-0">
            <input 
              className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-border-default appearance-none focus:outline-none focus:ring-0 focus:border-primary peer font-sans text-sm text-primary transition-colors" 
              id="fullName" 
              placeholder=" " 
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <label 
              className="absolute font-mono text-[10px] font-bold text-text-secondary duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 uppercase tracking-widest" 
              htmlFor="fullName"
            >
              Full Name
            </label>
          </div>
          
          {/* Email Input */}
          <div className="relative group/input z-0">
            <input 
              className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-border-default appearance-none focus:outline-none focus:ring-0 focus:border-primary peer font-sans text-sm text-primary transition-colors" 
              id="email" 
              placeholder=" " 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label 
              className="absolute font-mono text-[10px] font-bold text-text-secondary duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 uppercase tracking-widest" 
              htmlFor="email"
            >
              Email Address
            </label>
          </div>

          {/* Password Input */}
          <div className="relative group/input z-0">
            <input 
              className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-border-default appearance-none focus:outline-none focus:ring-0 focus:border-primary peer font-sans text-sm text-primary transition-colors" 
              id="password" 
              placeholder=" " 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
            />
            <label 
              className="absolute font-mono text-[10px] font-bold text-text-secondary duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 uppercase tracking-widest" 
              htmlFor="password"
            >
              Password
            </label>
          </div>
          <p className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider -mt-3">Must be at least 8 characters</p>

          {/* Submit Button */}
          <button 
            className="w-full bg-secondary hover:bg-secondary/95 text-white font-mono text-xs font-bold uppercase tracking-widest py-4 mt-4 transition-colors duration-200 rounded cursor-pointer flex items-center justify-center gap-2" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="w-3.5 h-3.5 animate-spin" />
                Registering...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full border-t border-dashed border-border-default"></div>

        {/* Footer Links */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
          <Link className="font-mono text-[10px] font-bold text-text-secondary hover:text-primary transition-colors uppercase tracking-wider mx-auto" to="/login">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
export default RegisterPage
