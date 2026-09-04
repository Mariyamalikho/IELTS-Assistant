import { Link } from "react-router-dom"
import { Github, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card py-6 px-4 md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">IELTS Assistant</span>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
        
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Mariyamalikho/IELTS-Assistant" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub Repository">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter Profile">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
