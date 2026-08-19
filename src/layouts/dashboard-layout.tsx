import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"
import { AppHeader } from "@/components/AppHeader"

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <AppHeader />
        
        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
