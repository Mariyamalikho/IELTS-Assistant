import { Link, useLocation } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/simulation": "Full Mock Exam",
  "/reading": "Reading Practice",
  "/writing": "Writing Evaluation",
  "/listening": "Listening Practice",
  "/speaking": "Speaking Interview",
  "/vocabulary": "Academic Vocabulary",
  "/privacy": "Privacy Policy",
}

export function Breadcrumbs() {
  const location = useLocation()
  const currentPath = location.pathname

  if (currentPath === "/dashboard" || currentPath === "/") {
    return null
  }

  const currentLabel = ROUTE_LABELS[currentPath] || currentPath.replace("/", "").replace(/-/g, " ")

  return (
    <nav aria-label="Breadcrumbs" className="mb-4 sm:mb-6 flex items-center text-xs font-medium text-muted-foreground">
      <ol className="flex items-center gap-1.5 list-none p-0 m-0">
        <li className="flex items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            title="Return to Candidate Dashboard"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </li>
        <li className="flex items-center text-muted-foreground/60" aria-hidden="true">
          <ChevronRight className="w-3.5 h-3.5" />
        </li>
        <li className="flex items-center text-foreground font-semibold truncate max-w-[200px] sm:max-w-none" aria-current="page">
          <span className="capitalize">{currentLabel}</span>
        </li>
      </ol>
    </nav>
  )
}
