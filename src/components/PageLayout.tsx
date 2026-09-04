import { Outlet } from "react-router-dom"
import { AppHeader } from "@/components/AppHeader"
import { Footer } from "@/components/Footer"

export function PageLayout() {
  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <AppHeader />
      
      <div className="flex-1 overflow-auto flex flex-col relative">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
        <Footer />
      </div>
    </main>
  )
}
