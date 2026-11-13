import { Outlet } from "react-router-dom"
import { AppHeader } from "@/components/AppHeader"
import { Footer } from "@/components/Footer"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export function PageLayout() {
  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <AppHeader />
      
      <div className="flex-1 overflow-auto flex flex-col relative">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Breadcrumbs />
          <Outlet />
        </div>
        <Footer />
      </div>
    </main>
  )
}
