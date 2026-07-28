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
  LogOut
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"

export default function DashboardLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
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
          <div className="text-sm font-medium text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">{user?.email}</span>
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
