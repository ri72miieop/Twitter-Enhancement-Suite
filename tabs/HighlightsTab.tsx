import { useState, useEffect } from "react"
import AccountTopTweetsClient from "~components/AccountTopTweetsClient"
import Tweet from "~components/Tweet"
import TweetList from "~components/TweetList"
import { supabase } from "~core/supabase"
import { fetchTopTweetsByUser } from "~utils/dbUtils"

function HighlightsTab() {
    const [topTweets, setTopTweets] = useState<any[]>(null)
    const [accountData, setAccountData] = useState<any>(null)

    useEffect(() => {

        async function fetchData() {
            console.log("fetching data")
            const data = await fetchTopTweetsByUser(supabase, "IaimforGOAT")
            console.log(data)
            const tweetData = {
                // liked: data.most_liked_tweets_by_archive_users,
                // replied: data.most_replied_tweets_by_archive_users,
                favorited: data.most_favorited_tweets,
                retweeted: data.most_retweeted_tweets,
            } 
            setTopTweets(tweetData.favorited)

            
        }

        fetchData()
    }, [])

    
// <AccountTopTweetsClient
// tweetData={topTweets}
// username="IaimforGOAT"
// displayName="IaimforGOAT"
// profilePicUrl="https://pbs.twimg.com/profile_images/1712168250441146368/4Fg5g55a_400x400.jpg"
// />

  return (<>
  {topTweets && topTweets.map((tweet: any) => (
    <Tweet key={tweet.tweet_id} tweet={tweet} />
  ))}
  </>)
}

export default HighlightsTab
