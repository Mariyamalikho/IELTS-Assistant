import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Settings, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"

export function SettingsModal() {
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  
  // Password change state
  const [newPassword, setNewPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('ielts_gemini_api_key') || "")
      setError("")
      setNewPassword("")
      setPasswordMessage({ type: "", text: "" })
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

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." })
      return
    }
    
    setIsUpdatingPassword(true)
    setPasswordMessage({ type: "", text: "" })
    
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    setIsUpdatingPassword(false)
    if (error) {
      setPasswordMessage({ type: "error", text: error.message })
    } else {
      setPasswordMessage({ type: "success", text: "Password updated successfully!" })
      setNewPassword("")
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger 
        render={<Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" />}
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-8 py-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">API Configuration</h3>
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
              <Button onClick={handleSave}>Save API Key</Button>
            </div>
          </div>

          {user && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Account Settings</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Change Password</label>
                <input
                  type="password"
                  placeholder="New password (min. 6 chars)"
                  className="w-full p-2 border rounded-md bg-background text-foreground"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordMessage({ type: "", text: "" })
                  }}
                />
                {passwordMessage.text && (
                  <p className={`text-sm ${passwordMessage.type === 'error' ? 'text-destructive' : 'text-green-500 font-medium'}`}>
                    {passwordMessage.text}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleUpdatePassword} 
                  disabled={isUpdatingPassword || !newPassword}
                  className="gap-2"
                >
                  {isUpdatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
