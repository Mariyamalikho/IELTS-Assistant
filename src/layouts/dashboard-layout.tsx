import { useState, useEffect } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { ModeToggle } from "@/components/mode-toggle"
import {
  LayoutDashboard,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  GraduationCap,
  Trophy,
  LogOut,
  Edit2,
  Flame
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"

export default function DashboardLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isEditingName, setIsEditingName] = useState(false)
  const [usernameInput, setUsernameInput] = useState("")
  const [apiUsage, setApiUsage] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (user) {
      setUsernameInput(user.user_metadata?.username || user.email?.split('@')[0] || "")
    }
  }, [user])

  useEffect(() => {
    const fetchUsage = () => {
      const today = new Date().toISOString().split('T')[0]
      const usageDate = localStorage.getItem('ielts_api_usage_date')
      if (usageDate === today) {
        setApiUsage(parseInt(localStorage.getItem('ielts_api_usage_count') || '0', 10))
      } else {
        setApiUsage(0)
      }
      setStreak(parseInt(localStorage.getItem('ielts_streak') || '0', 10))
    }
    
    fetchUsage()
    window.addEventListener('api_usage_updated', fetchUsage)
    return () => window.removeEventListener('api_usage_updated', fetchUsage)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSaveName = async () => {
    setIsEditingName(false)
    if (usernameInput.trim() && usernameInput !== user?.user_metadata?.username) {
      await supabase.auth.updateUser({ data: { username: usernameInput.trim() } })
    }
  }

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Mock Exam", path: "/simulation", icon: Trophy },
    { name: "Reading", path: "/reading", icon: BookOpen },
    { name: "Writing", path: "/writing", icon: PenTool },
    { name: "Listening", path: "/listening", icon: Headphones },
    { name: "Speaking", path: "/speaking", icon: Mic },
    { name: "Vocabulary", path: "/vocabulary", icon: GraduationCap },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-primary">IELTS Assistant</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Band 8+ Achiever</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              aria-label={`Navigate to ${item.name}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t space-y-4">
          <button 
            onClick={handleLogout}
            aria-label="Logout of account"
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <div className="text-sm font-medium text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            
            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
              <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak} Days</span>
            </div>
            
            {/* AI Usage Tracker */}
            <div className="flex flex-col gap-1 w-32 sm:w-48 group">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                <span>API Usage</span>
                <span>{apiUsage} / 1500</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${apiUsage > 1200 ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, (apiUsage / 1500) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group">
              {isEditingName ? (
                <input 
                  autoFocus
                  className="bg-muted text-sm font-medium outline-none text-foreground px-2 py-1 rounded w-32 focus:ring-1 focus:ring-primary"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  onBlur={handleSaveName}
                />
              ) : (
                <div 
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                  title="Click to edit username"
                >
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                    {user?.user_metadata?.username || user?.email?.split('@')[0]}
                  </span>
                  <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
            <ModeToggle />
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
