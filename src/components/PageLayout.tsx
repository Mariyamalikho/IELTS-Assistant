import { Outlet } from "react-router-dom"
import { AppHeader } from "@/components/AppHeader"

export function PageLayout() {
  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <AppHeader />
      
      <div className="flex-1 overflow-auto p-4 sm:p-8 relative">
        <Outlet />
      </div>
    </main>
  )
}
