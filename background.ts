import { supabase } from "~core/supabase"
import TweetStorage from "./contents/Storage/TweetsStorage"
import { DevLog } from "~utils/devUtils"


//rome.webRequest.onBeforeRequest.addListener(
//(details) => {
//  if (details.url.includes("twitter.com/i/api/") || details.url.includes("api.twitter.com/")) {
//      analyzeTwitterRequest(details);
//    }
//    console.log(details)
//},
//{urls: ["*://*.twitter.com/*", "*://*.x.com/*"]}
//
//
//rome.webRequest.onCompleted.addListener(
//  (details) => {
//    if (details.url.includes("twitter.com/i/api/") || details.url.includes("api.twitter.com/")) {
//      
//    }
//    console.log("After request completed:", details);
//  },
//  {urls: ["*://*.twitter.com/*", "*://*.x.com/*"]},
//  ["responseHeaders"]
//);
//
//nction analyzeTwitterRequest(details) {
//  const url = new URL(details.url);
//  
//  // Check for specific API endpoints
//  if (url.pathname.includes("/1.1/statuses/show.json")) {
//    // This is likely a tweet fetch request
//    console.log("Tweet fetch detected:", details);
//  } else if (url.pathname.includes("/1.1/favorites/create.json")) {
//    // This is likely a like action
//    console.log("Like action detected:", details);
//  } else if (url.pathname.includes("/1.1/statuses/retweet.json")) {
//    // This is likely a retweet action
//    console.log("Retweet action detected:", details);
//  } else if (url.pathname.includes("/1.1/favorites/destroy.json")) {
//    // This is likely an unlike action
//    console.log("Unlike action detected:", details);
//  }
//  
//  // You can add more conditions for other actions like bookmarks, etc.
//  
//  // Store the data using Plasmo's storage API
//  storeTwitterData(details);
//}
//
//async function storeTwitterData(data) {
//  const storage = new Storage();
//  await storage.set("twitter_data", data);
//}

console.log(
    "Live now; make now always the most precious time. Now will never come again."
  )




async function processTweets() {
  const tweetStorage = new TweetStorage()
  const tweets = await tweetStorage.getAllTweets()
  DevLog("Processing " + tweets.length + " tweets")
  
  for (const tweet of tweets) {
    try {
      // For now, processing is just logging the tweet
      DevLog("Processing tweet:" + tweet.id)


      const itemToInsert = {
        tweet_id : tweet.id,
        author_name : tweet.author.name,
        author_handle : tweet.author.handle,
        created_at : tweet.timestamp,
        full_text : tweet.content,
        retweet_count : tweet.engagement.reposts,
        favorite_count : tweet.engagement.likes,
        reply_to_tweet_id : null,
        reply_to_user_id : null,
        reply_to_username : null
      }

      const {data,error} = await supabase.from("import_tweets").insert(itemToInsert).select()
      if(error)
        DevLog(JSON.stringify(error))
      
      // Mark the tweet as saved after processing
      await tweetStorage.markAsSaved(tweet.id)
    } catch (error) {
      DevLog("Error processing tweet:" + error)
    }
  }
}

// Run processTweets every 10 minutes
setInterval(processTweets, 1 * 35 * 1000)

// Initial run
//processTweets()
