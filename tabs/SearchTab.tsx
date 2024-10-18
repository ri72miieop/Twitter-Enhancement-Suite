import { useEffect, useState } from "react"
import { supabase } from "~core/supabase"
import TweetList from "../components/TweetList"
import { parseQuery, buildSupabaseQuery } from "../utils/searchUtils"

function SearchTab() {
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
    <>
      <h2>Advanced Twitter Search</h2>
      <input 
        onChange={(e) => setSearch(e.target.value)} 
        value={search} 
        placeholder="Enter your search query..."
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
        style={{ marginBottom: 16, padding: 8 }}
      />
      {JSON.stringify(params, null, 2)}
      {isInputFocused && <SearchHelpText />}
      <TweetList data={data} />
    </>
  )
}

function SearchHelpText() {
  return (
    <div style={{ marginBottom: 16 }}>
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
    </div>
  )
}

export default SearchTab
