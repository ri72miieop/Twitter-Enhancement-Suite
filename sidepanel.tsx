import { faExternalLinkAlt, faHeart, faRetweet } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useEffect, useState } from "react"
import { Rettiwt } from "rettiwt-api"
import { supabase } from "~core/supabase"

// Helper function to parse the search query
function parseQuery(query: string) {
  const terms: { [key: string]: string } = {}
  const words = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []

  words.forEach((word) => {
    if (word.includes(":")) {
      const [key, value] = word.split(":")
      terms[key] = value.replace(/"/g, '')
    } else {
      terms.text = (terms.text || "") + " " + word
    }
  })

  return terms
}

// Helper function to build Supabase query
function buildSupabaseQuery(terms: { [key: string]: string }) {

  let params: any = {}
  
  if (terms.text) {
    params.search_query = terms.text.trim()
  }

  if (terms.from) {
    params.from_user = terms.from
  }

  if (terms.to) {
    params.to_user = terms.to
  }

  if (terms.since) {
    params.since_date = terms.since
  }

  if (terms.until) {
    params.until_date = terms.until
  }

  if (terms.min_retweets) {
    params.min_retweets = parseInt(terms.min_retweets)
  }

  if (terms.max_retweets) {
    params.max_retweets = parseInt(terms.max_retweets)
  }

  if (terms.min_faves || terms.min_likes) {
    params.min_likes = parseInt(terms.min_faves || terms.min_likes)
  }

  if (terms.max_faves || terms.max_likes) {
    params.max_likes = parseInt(terms.max_faves || terms.max_likes)
  }

  return params;
}

function IndexSidePanel() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [params, setParams] = useState<any>({})
  const [isInputFocused, setIsInputFocused] = useState(false)



  useEffect(() => {
    async function fetchData() {
      const terms = parseQuery(search)
      const params = buildSupabaseQuery(terms)
      setParams(params)
      
      const { data, error } = await supabase.rpc("search_tweets", params)

      if (error) {
        console.error(JSON.stringify(error, null, 2))
        return
      }

      console.log(JSON.stringify(data, null, 2))
      setData(data)
    }

    if (search) {
      fetchData()
    }
  }, [search])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "90vh", // Full viewport height
        padding: 16
      }}>
      <h2>
        Advanced Twitter Search 
      </h2>
      <input 
        onChange={(e) => setSearch(e.target.value)} 
        value={search} 
        placeholder="Enter your search query..."
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
        style={{ marginBottom: 16, padding: 8 }}
      />
      {JSON.stringify(params, null, 2)}
      {isInputFocused && <div style={{ marginBottom: 16 }}>
        <small>
          Examples:<br />
          - Simple search: cats dogs<br />
          - From user: from:username<br />
          - To user: to:username<br />
          - Since date: since:2023-01-01<br />
          - Until date: until:2023-12-31<br />
          - Min retweets: min_retweets:100<br />
          - Min likes: min_faves:500<br />
          - Language: lang:en
        </small>
      </div>}
      <div style={{ overflowY: "auto", flex: 1 }}>
        
      {data?.map((tweet) => (
        <div key={tweet.tweet_id} style={{ marginBottom: 16, borderBottom: '1px solid #e1e8ed', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <img src={tweet.avatar_media_url} alt={tweet.username} style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 12 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 'bold', marginRight: 4 }}>{tweet.account_display_name}</span>
                <span style={{ color: '#657786' }}>@{tweet.username}</span>
                <span style={{ color: '#657786', marginLeft: 'auto' }}>{new Date(tweet.created_at).toLocaleDateString()}</span>
                
              </div>
              <p style={{ margin: '0 0 10px 0', lineHeight: '1.4' }}>{tweet.full_text}</p>
              <div style={{ display: 'flex', color: '#657786', fontSize: '14px' }}>
                <span style={{ marginRight: 16 }}>
                  <FontAwesomeIcon icon={faRetweet} style={{ marginRight: 4 }}></FontAwesomeIcon>
                  {tweet.retweet_count}
                </span>
                <span>
                  <FontAwesomeIcon icon={faHeart} style={{ marginRight: 4 }}></FontAwesomeIcon>
                  {tweet.favorite_count}
                </span>
              </div>
            </div>
          </div>
          <a href={`https://twitter.com/${tweet.username}/status/${tweet.tweet_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1da1f2', textDecoration: 'none', fontSize: '14px', marginTop: 8, display: 'inline-block' }}>
                    <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginRight: 4 }} />
                    Open in Twitter
                </a>
        </div>
      ))}
      </div>
    </div>
  )
}

export default IndexSidePanel
