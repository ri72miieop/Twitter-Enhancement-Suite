
import { useEffect,useState } from "react"
import Tweet from "~components/Tweet"
import { supabase } from "~core/supabase"

function OnThisDay() {
        
    const [tweets, setTweets] = useState<any[]>([])

    useEffect(() => {
        async function fetchData() {
            const { data, error } = await supabase.rpc("get_tweets_on_this_day", {p_account_id:'345709253',p_limit:100})
            setTweets(data)
        }

        fetchData()
    }, [])
    
    return (
    <>{tweets.length}
        {tweets && tweets.map((tweet: any) => (
            <Tweet key={tweet.tweet_id} tweet={tweet} />
        ))}

    </>
    )
}



export default OnThisDay
