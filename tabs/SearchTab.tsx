import { useEffect, useState } from "react"
import { supabase } from "~core/supabase"
import TweetList from "../components/TweetList"
import { parseQuery, buildSupabaseQuery } from "../utils/searchUtils"
import { getSignedInUser } from "~utils/dbUtils"
import { DevLog } from "~utils/devUtils"
import posthog from "~core/posthog"

function SearchTab() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [signedInUser, setSignedInUser] = useState<any>(getSignedInUser())
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      if (!search) return;

      async function fetchData() {
        const terms = parseQuery(search)
        const params = buildSupabaseQuery(terms)
        
        let rpcFunction = "search_tweets";
        if(params.from_likes) {
         //if(!signedInUser|| !signedInUser.id) {
         //  setSignedInUser(await getSignedInUser())
         //}
          
          //if(signedInUser) {
          //  DevLog("signedInUser " + JSON.stringify(signedInUser, null, 2), "debug")
          //  params.auth_account_id = signedInUser.id;
          //  DevLog("signedInUser " + signedInUser.id, "debug")
          //}
          delete params.from_likes;
          rpcFunction = "search_liked_tweets";
        }
        
        setData([])
        if(errorMsg) setErrorMsg(null)
        const { data, error } = await supabase.schema("tes").rpc(rpcFunction, params)

        if (error) {
          console.error(JSON.stringify(error, null, 2))
          setData([])
          //setErrorMsg(`Error fetching tweets: ${error.message}`)
          posthog.capture('searched_tweets',{"query":params,rpcFunction:rpcFunction,"account_id":signedInUser?.id, "error":error.message})
          return
        }

        posthog.capture('searched_tweets',{"query":params,rpcFunction:rpcFunction,"account_id":signedInUser?.id, "count":data?.length||0})
        data.forEach((tweet) => {
          tweet.username = tweet.username || "unknown";
          tweet.account_display_name = tweet.account_display_name || "unknown";
          tweet.avatar_media_url = tweet.avatar_media_url || "assets/custom/nopfp2_4832.jpg";
          
        })
        DevLog(JSON.stringify(data, null, 2))
        setData(data)
      }

      fetchData()
    }, 1000) // 500ms debounce delay

    return () => clearTimeout(debounceTimeout)
  }, [search])

  return (
    <>
      <h2>Advanced Community Archive Search</h2>
      <input 
        onChange={(e) => setSearch(e.target.value)} 
        value={search} 
        placeholder="Enter your search query..."
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
        style={{ marginBottom: 16, padding: 8 }}
      />
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMsg}
        </div>
      )}
      {isInputFocused && <SearchHelpText />}
      <button
        onClick={() => {
          const tweetInfo = data.map(tweet => 
            `${tweet.username} (${tweet.account_display_name}): ${tweet.full_text}`
          ).join('\n\n');
          navigator.clipboard.writeText(tweetInfo);
        }}
        className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors duration-200"
      >
        Copy Tweet Info to Clipboard
      </button>
      <button
        onClick={() => {
          const tweetInfo = data.map(tweet => 
            `${tweet.username} (${tweet.account_display_name}): ${tweet.full_text}`
          ).join('\n\n');
          const blob = new Blob([tweetInfo], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'tweets.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}
        className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors duration-200"
      >
        Download Tweet Info as TXT
      </button>
      <TweetList data={data} />
    </>
  )
}

function SearchHelpText() {
  return (
    <div style={{ marginBottom: 16 }}>
      <small>
        Examples:<br />
        - Simple search » cats dogs<br />
        - From user » from:username<br />
        - To user » to:username<br />
        - Since date » since:2023-01-01<br />
        - Until date » until:2023-12-31<br />
        - Min retweets » min_retweets:100<br />
        - Min likes » min_faves:500<br />
        - Search only on your likes  from_likes:true
      </small>
    </div>
  )
}

export default SearchTab
