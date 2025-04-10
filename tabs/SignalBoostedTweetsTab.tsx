import React, { useEffect, useState } from 'react';

import { User } from 'lucide-react';
import { supabase } from '~core/supabase';
import { getUser } from '~utils/dbUtils';
import { DevLog } from '~utils/devUtils';

interface BoostedTweet {
  tweet_id: string;
  account_id: string;
  created_at: string;
  full_text: string;
  boost_score: number;
  url: string;
  boosted_by_following: number;
  boosted_by_mutual: number;
  username: string;
  account_display_name: string;
  avatar_media_url: string;
}

export const SignalBoostedTweetsTab: React.FC = () => {
  const [tweets, setTweets] = useState<BoostedTweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoostedTweets();
  }, []);

  const fetchBoostedTweets = async () => {
    try {
      const user = await getUser()
      if (!user) {
        setError('User not authenticated');
        return;
      }
      DevLog("calling rpc for ", user.id)
      const { data, error: rpcError } = await supabase.rpc(
        'get_boosted_tweets',
        { p_viewer_id: user.id, p_limit: 50 }
      ).order('boost_score', { ascending: false });

      if (rpcError) throw rpcError;
      setTweets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBoost = async (tweetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('signal_boosts').upsert({
        tweet_id: tweetId,
        boosted_by: user.id
      });

      await fetchBoostedTweets();
    } catch (err) {
      console.error('Error boosting tweet:', err);
    }
  };

  if (loading) return <div className="p-4">Loading boosted tweets...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="max-h-[600px] overflow-y-auto">
      {tweets.map((tweet) => (
        <div key={tweet.tweet_id} className="p-4 border-b hover:bg-gray-50">
          <div className="flex gap-3">
            {tweet.avatar_media_url ? (
              <img 
                src={tweet.avatar_media_url} 
                alt={tweet.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <User className="w-10 h-10 p-2 bg-gray-100 rounded-full" />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{tweet.account_display_name}</div>
                  <div className="text-sm text-gray-500">@{tweet.username}</div>
                </div>
                <button
                  onClick={() => handleBoost(tweet.tweet_id)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                  Boost
                </button>
              </div>
              <p className="mt-2 text-gray-900">{tweet.full_text}</p>
              <a 
                href={tweet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline mt-1 block"
              >
                {tweet.url}
              </a>
              <div className="mt-2 text-sm text-gray-500">
                Boost Score: {tweet.boost_score.toFixed(2)}
                <span className="mx-2">•</span>
                {tweet.boosted_by_following} following
                <span className="mx-2">•</span>
                {tweet.boosted_by_mutual} mutuals
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};



export default SignalBoostedTweetsTab
