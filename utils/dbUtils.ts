import { SupabaseClient } from "@supabase/supabase-js"

export const fetchTopTweetsByUser = async (supabase: SupabaseClient, username: string): Promise<any> => {
    const { data, error } = await supabase
    .from('account_activity_summary' as any)
    .select('most_retweeted_tweets, most_favorited_tweets')
    .eq('username', username)
    .single()
  
    if (error) throw error
  
    return data;
  }
