import { useState, useEffect } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { Edit2, Flame } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { MobileNav } from "@/components/MobileNav"
import { SettingsModal } from "@/components/SettingsModal"

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
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-4 sm:gap-6">
        <MobileNav />
        <div className="text-xs font-medium text-muted-foreground hidden lg:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        
        {/* Streak Counter */}
        <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md border border-border text-xs font-medium text-foreground">
          <Flame className="w-3.5 h-3.5 text-primary" />
          <span>{streak} {streak === 1 ? 'Day Streak' : 'Days Streak'}</span>
        </div>
        
        {/* Daily Allowance Tracker */}
        <div className="flex flex-col gap-1 w-28 sm:w-40 group">
          <div className="flex justify-between items-center text-[11px] text-muted-foreground font-medium">
            <span>Daily Limit</span>
            <span>{apiUsage}/1500</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-sm overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${apiUsage > 1200 ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, (apiUsage / 1500) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 group">
          {isEditingName ? (
            <input 
              autoFocus
              className="bg-muted text-xs font-medium outline-none text-foreground px-2 py-1 rounded border border-border w-28 focus:ring-1 focus:ring-primary"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              onBlur={handleSaveName}
            />
          ) : (
            <button 
              type="button"
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-1.5 hover:bg-muted/60 px-2 py-1 rounded text-xs font-medium text-foreground transition-colors"
              title="Click to edit username"
            >
              <span className="truncate max-w-[140px]">
                {user?.user_metadata?.username || user?.email?.split('@')[0]}
              </span>
              <Edit2 className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
            </button>
          )}
        </div>
        <SettingsModal />
        <ModeToggle />
      </div>
    </header>
  )
}
