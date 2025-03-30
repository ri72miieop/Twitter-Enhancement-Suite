import { useState } from "react"
import { extractDataFromResponse, extractTimelineTweet, isTimelineEntryConversationThread, isTimelineEntryHomeConversationThread, isTimelineEntryTweet } from "~utils/twe_utils"
import type { TimelineAddEntriesInstruction, TimelineInstructions, TimelineTweet, Tweet } from "../InterceptorModules/types"
import { DevLog } from "~utils/devUtils"

interface HomeTimelineResponse {
  data: {
    home: {
      home_timeline_urt: {
        instructions: TimelineInstructions
        metadata: unknown
        responseObjects: unknown
      }
    }
  }
}

export default function DebugTimelineProcessor() {
  const [processedData, setProcessedData] = useState<Tweet[]>([])
  const [error, setError] = useState<string | null>(null)

  const processTimelineData = (json: HomeTimelineResponse) => {
    const instructions = json.data.home.home_timeline_urt.instructions
    const newData: Tweet[] = []

    const timelineAddEntriesInstruction = instructions.find(
      (i) => i.type === 'TimelineAddEntries',
    ) as TimelineAddEntriesInstruction<TimelineTweet>

    const timelineAddEntriesInstructionEntries = timelineAddEntriesInstruction?.entries ?? []

    for (const entry of timelineAddEntriesInstructionEntries) {
      if (isTimelineEntryTweet(entry)) {
        const tweet = extractTimelineTweet(entry.content.itemContent)
        if (tweet) {
          newData.push(tweet)
        }
      }

      if (isTimelineEntryHomeConversationThread(entry)) {
        const tweetsInConversation = entry.content.items.map((i) => {
          if (i.entryId.includes('-tweet-')) {
            return extractTimelineTweet(i.item.itemContent)
          }
        })

        newData.push(...tweetsInConversation.filter((t): t is Tweet => !!t))
      }
    }

    return newData
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setError(null)

    const file = e.dataTransfer.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as HomeTimelineResponse
        const processed = processTimelineData(json)
        setProcessedData(processed)
      } catch (err) {
        setError(`Failed to process file: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg p-4 z-50">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p className="text-gray-600">Drag and drop a timeline JSON file here</p>
      </div>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {processedData.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Processed Tweets ({processedData.length})</h3>
          <div className="max-h-96 overflow-y-auto">
            {processedData.map((tweet) => (
              <div key={tweet.rest_id} className="border-b border-gray-200 py-2">
                <p className="font-medium">
                  {tweet.core.user_results.result.legacy.name} (@{tweet.core.user_results.result.legacy.screen_name})
                </p>
                <p className="text-sm text-gray-600">{tweet.legacy.full_text}</p>
                <p className="text-xs text-gray-400">ID: {tweet.rest_id}</p>
                <div className="text-xs text-gray-500 mt-1">
                  <span>❤️ {tweet.legacy.favorite_count}</span>
                  <span className="mx-2">🔄 {tweet.legacy.retweet_count}</span>
                  <span>💬 {tweet.legacy.reply_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 