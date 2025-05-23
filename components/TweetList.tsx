import { ExternalLink, Heart, Repeat } from "lucide-react"

import Tweet from "./Tweet"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/shadcn/Avatar"

function TweetList({ data }) {
  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      {data?.map((tweet) => (
        <div
          key={tweet.tweet_id}
          style={{
            marginBottom: 16,
            borderBottom: "1px solid #e1e8ed",
            padding: "12px 16px"
          }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
           

            <Avatar>
              <AvatarImage src={tweet.avatar_media_url} alt={tweet.username} />
              <AvatarFallback>{tweet.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 4
                }}>
                <span style={{ fontWeight: "bold", marginRight: 4 }}>
                  {tweet.account_display_name}
                </span>
                <span style={{ color: "#657786" }}>@{tweet.username}</span>
                <span style={{ color: "#657786", marginLeft: "auto" }}>
                  {new Date(tweet.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: "0 0 10px 0", lineHeight: "1.4" }}>
                {tweet.full_text}
              </p>
              <div
                style={{ display: "flex", color: "#657786", fontSize: "14px" }}>
                <span style={{ marginRight: 16 }}>
                  <Repeat className="inline mr-1" size={14}></Repeat>
                  {tweet.retweet_count}
                </span>
                <span>
                  <Heart className="inline mr-1" size={14} />
                  {tweet.favorite_count}
                </span>

                <span style={{ marginLeft: "auto" }}>
                  <a
                    href={`https://twitter.com/${tweet.username}/status/${tweet.tweet_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#1da1f2",
                      textDecoration: "none",
                      display: "inline-block"
                    }}>
                    <ExternalLink className="inline mr-1" size={14} />
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TweetList
