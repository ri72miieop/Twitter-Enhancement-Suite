// Helper function to parse the search query
export function parseQuery(query: string) {
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
export function buildSupabaseQuery(terms: { [key: string]: string }) {
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

  if(terms.from_likes || terms.from_like) {
    params.from_likes = terms.from_likes.toLowerCase() === "true" || terms.from_likes === "1" || terms.from_likes === "yes"
  }

  return params;
}
