import { useEffect, useState } from "react"

import Tweet from "~components/Tweet"
import { supabase } from "~core/supabase"
import { getUser } from "~utils/dbUtils"
import { DevLog } from "~utils/devUtils"
import posthog from '~core/posthog'

function OnThisDay() {
  const [tweets, setTweets] = useState<any[]>([])
  const [isUserSignedIn, setIsUserSignedIn] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const user = await getUser()
      if (!user || !user.id) {
        setIsUserSignedIn(false)
        return
      } else {
        setIsUserSignedIn(true)
      }
      const { data: rawData, error } = await supabase.rpc("tes_get_tweets_on_this_day", {
        p_account_id: user.id,
        p_limit: 100
      })
      //TODO: remove deduplicate TEMP SOLUTION
      const data = rawData ? [...new Map(rawData.map(item => [item.tweet_id, item])).values()] : []
      if(error) {
        DevLog(JSON.stringify(error),"error")
      }
      posthog.capture('viewed_on_this_day',{"account_id":user.id})
      
      setTweets(data)
    }
    
    fetchData()
  }, [])

  return (
    <>
      {isUserSignedIn &&
        tweets.length > 0 &&
        tweets.map((tweet: any) => (
          <Tweet key={tweet.tweet_id} tweet={tweet} />
        ))}
      {!isUserSignedIn && <div>Please sign in to view this page.</div>}
      {isUserSignedIn && tweets.length === 0 && (
        <div>No tweets found for this day.</div>
      )}
    </>
  )
}

export default OnThisDay
