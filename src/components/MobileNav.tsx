import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Menu,
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
  { name: "Mock Exam", path: "/simulation", icon: Trophy },
  { name: "Reading", path: "/reading", icon: BookOpen },
  { name: "Writing", path: "/writing", icon: PenTool },
  { name: "Listening", path: "/listening", icon: Headphones },
  { name: "Speaking", path: "/speaking", icon: Mic },
  { name: "Vocabulary", path: "/vocabulary", icon: GraduationCap },
]

export function MobileNav() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-primary">IELTS Assistant</h2>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setOpen(false)}
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
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
