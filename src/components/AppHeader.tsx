import { useState, useEffect } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { Edit2, Flame } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { MobileNav } from "@/components/MobileNav"

export function AppHeader() {
  const { user } = useAuth()
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

  const handleSaveName = async () => {
    setIsEditingName(false)
    if (usernameInput.trim() && usernameInput !== user?.user_metadata?.username) {
      await supabase.auth.updateUser({ data: { username: usernameInput.trim() } })
    }
  }

  return (
    <header className="h-auto min-h-16 py-2 border-b border-border bg-card flex flex-wrap items-center justify-between px-4 sm:px-8 gap-y-3">
      <div className="flex items-center gap-4 sm:gap-6">
        <MobileNav />
        <div className="text-sm font-medium text-muted-foreground hidden lg:block">
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
  )
}
