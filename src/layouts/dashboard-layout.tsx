import { Sidebar } from "@/components/Sidebar"
import { PageLayout } from "@/components/PageLayout"

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <PageLayout />
    </div>
  )
}
