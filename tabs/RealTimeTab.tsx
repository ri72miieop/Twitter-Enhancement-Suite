import { useEffect, useState, useRef } from "react"
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from "~core/supabase"

import AccountTopTweetsClient from "~components/AccountTopTweetsClient"

import Tweet from "~components/Tweet"
import TweetList from "~components/TweetList"
import { fetchTopTweetsByUser } from "~utils/dbUtils"
import { DevLog } from "~utils/devUtils"
import { extractXUsername } from "~utils/TwitterUtils"

function RealTimeTab() {
  const [tweets, setTweets] = useState<any[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Create and subscribe to the channel
    const channel = supabase
      .channel('realtime-tweets')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tweets'
        },
        (payload) => {
          console.log('[realtime.tweets] Change received!', payload)
          setTweets(prevTweets => [...prevTweets, payload.new])
        }
      )
      .subscribe((status) => {
        console.log('[realtime.tweets] Subscription status:', status)
      })

    channelRef.current = channel

    // Log the initial subscription
    console.log('[realtime.tweets] Channel created:', channel)

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('[realtime.tweets] Cleaning up channel subscription')
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  return (
    <>
      <div>Number of tweets: {tweets.length}</div>
      {tweets.map((tweet: any, index) => (
        <Tweet key={tweet.tweet_id} tweet={tweet} />
      ))}
    </>
  )
}

export default RealTimeTab
