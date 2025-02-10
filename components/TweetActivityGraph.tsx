//TODO ! https://x.com/DefenderOfBasic/status/1886940077294518521?t=-Kb-rJTqdUGiB2Iy3lfjxA



import type { InsertTweets } from "~types/database-explicit-types"
import { useEffect, useState } from "react"

interface ActivitySquareProps {
  intensity: number
  count: number
  date: string
}

const ActivitySquare: React.FC<ActivitySquareProps> = ({ intensity, count, date }) => {
  const getColor = (intensity: number) => {
    if (intensity === 0) return "#ebedf0"
    if (intensity <= 0.25) return "#9be9a8"
    if (intensity <= 0.5) return "#40c463"
    if (intensity <= 0.75) return "#30a14e"
    return "#216e39"
  }

  return (
    <div
      title={`${count} tweets on ${date}`}
      style={{
        width: "10px",
        height: "10px",
        backgroundColor: getColor(intensity),
        margin: "2px",
        borderRadius: "2px"
      }}
    />
  )
}

interface TweetActivityGraphProps {
  tweets: InsertTweets[]
}

interface DayActivity {
  count: number
  intensity: number
}

const TweetActivityGraph: React.FC<TweetActivityGraphProps> = ({ tweets }) => {
  const [activityData, setActivityData] = useState<Map<string, DayActivity>>(new Map())
  const [maxCount, setMaxCount] = useState(0)

  useEffect(() => {
    const data = new Map<string, DayActivity>()
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)

    // Initialize all dates in the last year with 0
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      data.set(d.toISOString().split('T')[0], { count: 0, intensity: 0 })
    }

    // Count tweets per day
    tweets.forEach((tweet) => {
      const date = new Date(tweet.created_at).toISOString().split('T')[0]
      if (data.has(date)) {
        const currentData = data.get(date)
        data.set(date, {
          count: (currentData?.count || 0) + 1,
          intensity: 0 // Will be calculated after finding max
        })
      }
    })

    // Find maximum daily count
    let max = 0
    data.forEach((value) => {
      max = Math.max(max, value.count)
    })
    setMaxCount(max)

    // Calculate intensities
    data.forEach((value, key) => {
      data.set(key, {
        ...value,
        intensity: max > 0 ? value.count / max : 0
      })
    })

    setActivityData(data)
  }, [tweets])

  const weeks = Array.from({ length: 53 }, (_, i) => i)
  const days = Array.from({ length: 7 }, (_, i) => i)

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)"
      }}>
      <div style={{ fontSize: "14px", marginBottom: "10px" }}>
        Tweet Activity (Max {maxCount} tweets/day)
      </div>
      <div style={{ display: "flex" }}>
        <div
          style={{
            display: "grid",
            gridTemplateRows: "repeat(7, 1fr)",
            gap: "2px",
            marginRight: "4px",
            fontSize: "10px"
          }}>
          <div>Mon</div>
          <div>Wed</div>
          <div>Fri</div>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          {weeks.map((week) => (
            <div
              key={week}
              style={{
                display: "grid",
                gridTemplateRows: "repeat(7, 1fr)",
                gap: "2px"
              }}>
              {days.map((day) => {
                const date = new Date(Date.now())
                date.setDate(date.getDate() - (weeks.length - week - 1) * 7 - (6 - day))
                const dateStr = date.toISOString().split('T')[0]
                const dayActivity = activityData.get(dateStr) || { count: 0, intensity: 0 }
                return (
                  <ActivitySquare
                    key={`${week}-${day}`}
                    intensity={dayActivity.intensity}
                    count={dayActivity.count}
                    date={dateStr}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          marginTop: "4px",
          gap: "4px",
          fontSize: "12px"
        }}>
        Less
        {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
          <ActivitySquare
            key={intensity}
            intensity={intensity}
            count={Math.round(intensity * maxCount)}
            date=""
          />
        ))}
        More
      </div>
    </div>
  )
}

export default TweetActivityGraph 