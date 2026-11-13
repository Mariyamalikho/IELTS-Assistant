import { Link } from "react-router-dom"
import { Code2 } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {/* Brand Col */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="IELTS Assistant" className="h-5 w-5 rounded shrink-0" />
              <span className="font-semibold text-foreground tracking-tight">IELTS Assistant</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standardized preparation workspace for Cambridge IELTS Academic and General Training examinations.
            </p>
          </div>

          {/* Test Sections */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Exam Sections</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Link to="/reading" className="hover:text-foreground transition-colors">
                  Academic & General Reading
                </Link>
              </li>
              <li>
                <Link to="/writing" className="hover:text-foreground transition-colors">
                  Writing Task 1 & Task 2
                </Link>
              </li>
              <li>
                <Link to="/listening" className="hover:text-foreground transition-colors">
                  Listening Audio Modules
                </Link>
              </li>
              <li>
                <Link to="/speaking" className="hover:text-foreground transition-colors">
                  Speaking Interview Drills
                </Link>
              </li>
            </ul>
          </div>

          {/* Practice & Resources */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Preparation Tools</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Link to="/simulation" className="hover:text-foreground transition-colors">
                  Full Timed Mock Exam
                </Link>
              </li>
              <li>
                <Link to="/vocabulary" className="hover:text-foreground transition-colors">
                  Academic Word List (AWL)
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-foreground transition-colors">
                  Band Score & Progress Tracker
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Candidate Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & External */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Compliance & Code</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Designed following official British Council and IDP band scoring assessment rubrics.
            </p>
            <div className="pt-1">
              <a
                href="https://github.com/Mariyamalikho/IELTS-Assistant"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub Repository"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Source Repository</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} IELTS Assistant. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              Candidate Workspace
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
