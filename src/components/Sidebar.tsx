import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  GraduationCap,
  Trophy,
  LogOut
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Full Mock Exam", path: "/simulation", icon: Trophy },
  { name: "Reading", path: "/reading", icon: BookOpen },
  { name: "Writing", path: "/writing", icon: PenTool },
  { name: "Listening", path: "/listening", icon: Headphones },
  { name: "Speaking", path: "/speaking", icon: Mic },
  { name: "Vocabulary", path: "/vocabulary", icon: GraduationCap },
]

export function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex shrink-0">
      <div className="p-5 flex items-center gap-3 border-b border-border">
        <img src="/favicon.svg" alt="IELTS Assistant Crest" width="36" height="36" className="h-9 w-9 rounded-md shrink-0" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-foreground truncate">IELTS Assistant</h2>
          <p className="text-xs text-muted-foreground truncate">Academic & General Prep</p>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            aria-label={`Navigate to ${item.name}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-xs" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button 
          onClick={handleLogout}
          aria-label="Logout of account"
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
