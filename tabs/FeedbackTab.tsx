import { sendToBackground } from "@plasmohq/messaging"
import { useEffect, useState } from "react"
import { getUser } from "~utils/dbUtils"
import { DevLog } from "~utils/devUtils"




function FeedbackPage() {
  const [feedback, setFeedback] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [user, setUser] = useState<{id: any, username: any} | null>(null)

  useEffect(() => {
    getUser().then(user => {
      if(!user) return
      setUser(user)
    })
  }, [])

  const sendFeedback = async () => {
    if (!feedback.trim()) return
    
    if(!user) return
    setSending(true)
    try {
      const res = await sendToBackground({
        name: "send-feedback",
        body: {
          user: user,
          feedback: feedback
        }
      });

      if(res.error) throw new Error(res.error)

      setSent(true)
      setFeedback("")
    } catch (error) {
      console.error("Error sending feedback:", error)
    } finally {
      setSending(false)
    }
  }

  if(!user) return <div>Please sign in to send feedback</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Send Feedback</h1>
      
      <div className="space-y-4">
        <textarea
          placeholder="Tell us what you think..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={6}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />

        <button
          onClick={sendFeedback}
          disabled={sending || !feedback.trim()}
          className={`w-full py-2 px-4 rounded-md text-black font-medium transition-colors duration-200
            ${sending || !feedback.trim() 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {sending ? "Sending..." : "Send Feedback"}
        </button>

        {sent && (
          <div className="text-green-600 text-center">
            Thank you for your feedback!
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackPage
