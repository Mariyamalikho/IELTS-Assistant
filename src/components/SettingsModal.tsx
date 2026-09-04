import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export function SettingsModal() {
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('ielts_gemini_api_key') || "")
      setError("")
    }
  }, [isOpen])

  const handleSave = () => {
    if (apiKey && !/^AIza[a-zA-Z0-9_-]{35}$/.test(apiKey)) {
      setError("Invalid Gemini API Key format.")
      return
    }
    
    if (apiKey) {
      localStorage.setItem('ielts_gemini_api_key', apiKey)
    } else {
      localStorage.removeItem('ielts_gemini_api_key')
    }
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Gemini API Key (Optional)</label>
            <input
              type="password"
              autoComplete="off"
              placeholder="AIzaSy..."
              className="w-full p-2 border rounded-md bg-background text-foreground"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setError("")
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              By default, the app uses the shared server API key. You can provide your own here to avoid rate limits. Your key is stored securely in your browser's local storage.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
