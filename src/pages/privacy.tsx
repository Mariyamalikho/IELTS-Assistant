import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 text-primary rounded-full">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      </div>

      <Card className="shadow-sm border-muted">
        <CardHeader>
          <CardTitle>How We Handle Your Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Local Storage First</h2>
            <p>
              Your privacy is our priority. A significant portion of your data, including your vocabulary flashcards, study streaks, and AI API keys (if explicitly provided), are stored entirely locally in your browser using `localStorage`. This means it never leaves your device unless specifically transmitted for a feature.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Cloud Data Storage</h2>
            <p>
              When you submit practice tests (Writing and Speaking), your submissions are securely stored in our encrypted Supabase database to track your progress and provide historical performance charts. This data is associated with your authenticated account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Artificial Intelligence</h2>
            <p>
              We utilize Google's Gemini AI to grade your practice tests and generate study materials. Your submitted essays and audio recordings are transmitted to the Gemini API securely. Please refrain from submitting personally identifiable information (PII) in your practice tests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Audio Processing</h2>
            <p>
              During Speaking mock exams, audio is recorded locally and converted to a base64 string before being sent to our backend proxy for AI evaluation. Audio files are not permanently stored on our servers; they are processed ephemerally for grading purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Data Deletion</h2>
            <p>
              You maintain full control over your data. You can completely wipe your progress, history, and local storage data at any time by using the "Reset Progress" functionality located directly on your Dashboard.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
