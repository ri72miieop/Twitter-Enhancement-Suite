import { useCallback, useState } from "react"
import { Tabs } from "./ui/tabs"
import { TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ScrollArea } from "./ui/ScrollArea"
import Tweet from "./Tweet"
import { ExternalLink,Repeat,Heart } from "lucide-react"


type TabData = {
    [key: string]: {
      title: string
    }
  }
  
  const tabData: TabData = {
    // liked: { title: 'Top Liked by CA Users' },
    // replied: { title: 'Top Replied to by CA Users' },
    favorited: { title: 'Top Favorited' },
    retweeted: { title: 'Top Retweeted' },
  }
  
  type Props = {
    tweetData: { [key: string]: any[] }
    username: string
    displayName: string
    profilePicUrl: string
  }
  
  const AccountTopTweetsClient: React.FC<Props> = ({
    tweetData,
    username,
    displayName,
    profilePicUrl,
  }) => {
    const [activeTab, setActiveTab] = useState('favorited')
    const [includedTabs, setIncludedTabs] = useState<{ [key: string]: boolean }>({
      // liked: true,
      // replied: true,
      favorited: true,
      retweeted: true,
    })
  
    const getTweetsAsText = useCallback(() => {
      const allTweets = Object.entries(tweetData)
        .filter(([key]) => includedTabs[key])
        .flatMap(([_, tweets]) => tweets)
  
      const uniqueTweets = Array.from(
        new Map(allTweets.map((tweet) => [tweet.tweet_id, tweet])).values(),
      )
  
      const sortedTweets = uniqueTweets.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  
      const tweetTexts = sortedTweets
        .map((tweet) => {
          const date = new Date(tweet.created_at).toLocaleString()
          const replyTo = tweet.reply_to_username
            ? `Replying to @${tweet.reply_to_username}\n`
            : ''
          return `${date}\n${replyTo}${tweet.full_text}\n\n`
        })
        .join('')
  
      const prefix = `Top tweets from @${username} as of ${new Date().toDateString()}\n\n`
  
      return prefix + tweetTexts
    }, [tweetData, username, includedTabs])
  
    const toggleTabInclusion = (tab: string) => {
      setIncludedTabs((prev) => ({ ...prev, [tab]: !prev[tab] }))
    }
  
    return (
      <div>
        <div className="mb-4 flex items-center justify-end">
          {/* <div className="flex items-center space-x-4">
            {Object.keys(tabData).map((key) => (
              <label key={key} className="flex items-center space-x-2">
                <Checkbox
                  checked={includedTabs[key]}
                  onCheckedChange={() => toggleTabInclusion(key)}
                />
                <span className="text-sm">{tabData[key].title}</span>
              </label>
            ))}
          </div> */}
          <div>
            <span className="mr-4 text-sm text-gray-600">
              Copy all tweets as text
            </span>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {Object.entries(tabData).map(([key, { title }]) => (
              <TabsTrigger key={key} value={key}>
                {title}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(tabData).map(([key, { title }]) => (
            <TabsContent key={key} value={key}>
              <ScrollArea className="h-[33vh]">
                <ul>
                  {tweetData[key]?.map((tweet) => (
                    //<Tweet tweet={tweet} />
                     //key={tweet.tweet_id}
                     //username={username}
                     //displayName={displayName}
                     //profilePicUrl={profilePicUrl}
                     //text={tweet.full_text}
                     //favoriteCount={tweet.favorite_count}
                     //retweetCount={tweet.retweet_count}
                     //date={tweet.created_at}
                     //tweetUrl={`https://twitter.com/${username}/status/${tweet.tweet_id}`}
                     //tweetId={tweet.tweet_id}
                     //replyToUsername={tweet.reply_to_username || undefined}
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
                <Repeat className="inline mr-1" size={14} ></Repeat>
                {tweet.retweet_count}
              </span>
              <span>
                <Heart className="inline mr-1" size={14} />
                {tweet.favorite_count}
              </span>
            </div>
          </div>
        </div>
        <a href={`https://twitter.com/${tweet.username}/status/${tweet.tweet_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1da1f2', textDecoration: 'none', fontSize: '14px', marginTop: 8, display: 'inline-block' }}>
          <ExternalLink className="inline mr-1" size={14} />
          Open in Twitter
        </a>
      
                     {tweet.tweet_id}
                     {username}
                     {displayName}
                     {profilePicUrl}
                     {tweet.full_text}
                     {tweet.favorite_count}
                     {tweet.retweet_count}
                     {tweet.created_at}
                     {`https://twitter.com/${username}/status/${tweet.tweet_id}`}
                     {tweet.tweet_id}
                     {tweet.reply_to_username }
                     </div>
                  ))}
                </ul>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    )
  }
  
  export default AccountTopTweetsClient
  