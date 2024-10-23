import { useState, useEffect } from "react"
import AccountTopTweetsClient from "~components/AccountTopTweetsClient"
import Tweet from "~components/Tweet"
import TweetList from "~components/TweetList"
import { supabase } from "~core/supabase"
import { fetchTopTweetsByUser } from "~utils/dbUtils"

function HighlightsTab() {
    const [topTweets, setTopTweets] = useState<any[]>(null)

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
            
            
            const {data:account} = await supabase.from('account').select('account_id,username,account_display_name').eq('account_id','345709253');
            const {data:profile} = await supabase.from('profile').select('*').eq('account_id',account[0].account_id);

            console.log(tweetData.favorited);
            for(let i = 0; i < tweetData.favorited.length; i++){

              tweetData.favorited[i].avatar_media_url = profile[0].avatar_media_url;
              tweetData.favorited[i].username = account[0].username;
              tweetData.favorited[i].account_display_name = account[0].account_display_name;
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
