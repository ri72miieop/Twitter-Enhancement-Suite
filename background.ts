import TweetStorage from "~contents/Storage/TweetsStorage"
import { supabase } from "~core/supabase"
import { TwitterDataMapper } from "~InterceptorModules/utils/TwitterDataMapper"
import type { Tweet, User } from "~InterceptorModules/types"
import { DevLog } from "~utils/devUtils"
import { indexDB, type TimedObject } from "~utils/IndexDB"
import { GlobalCachedData } from "~contents/Storage/CachedData"
import { getSignedInUser, getUser } from "~utils/dbUtils"
import type { UserMinimal } from "~utils/dbUtils"

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
        tweet_id: tweet.id,
        author_name: tweet.author.name,
        author_handle: tweet.author.handle,
        created_at: tweet.timestamp,
        full_text: tweet.content,
        retweet_count: tweet.engagement.reposts,
        favorite_count: tweet.engagement.likes,
        reply_to_tweet_id: null,
        reply_to_user_id: null,
        reply_to_username: null
      }

      const { data, error } = await supabase
        .from("import_tweets")
        .insert(itemToInsert)
        .select()
      if (error) DevLog(JSON.stringify(error))

      // Mark the tweet as saved after processing
      await tweetStorage.markAsSaved(tweet.id)
    } catch (error) {
      DevLog("Error processing tweet:" + error)
    }
  }
}

async function processRecordsIndexDB() {

  const records = await indexDB.data
    .filter((data) => data.timestamp == null)
    .toArray()
  DevLog(
    "Interceptor.background.processRecordsIndexDB - FromIndexDB:" +
      (await indexDB.data.count())
  )
  DevLog(
    "Interceptor.background.processRecordsIndexDB - FromIndexDB:" +
      JSON.stringify(records)
  )
  DevLog(
    "Interceptor.background.processRecordsIndexDB - Processing " +
      records.length +
      " records"
  )

  const startTime = process.env.NODE_ENV === 'development' ? performance.now() : null;
  for (const record of records) {

    const canScrape = await GlobalCachedData.GetCanScrape(record.user_id)
    DevLog("Interceptor.background.processRecordsIndexDB - canScrape:" + canScrape)
    if(!canScrape) {DevLog("User is blocked from scraping"); continue;}



    const otherRecords = await indexDB.data.filter(r => r.item_id === record.item_id && r.originator_id === record.originator_id && r.type === record.type).toArray();
    DevLog("Interceptor.background.processRecordsIndexDB_otherRecords - otherRecords:" + otherRecords.length + " for record:" + record.item_id + " " + record.type + " " + record.originator_id)
    if(otherRecords.length > 1) {
      DevLog("Interceptor.background.processRecordsIndexDB_otherRecords - Skipping record:" + JSON.stringify(otherRecords))
      
    }
    const newDate = new Date().toISOString()
    try {
      if (record.timestamp != null) continue
      // For now, processing is just logging the tweet
      record.timestamp = newDate

      const { data, error } = await supabase
        .from("temporary_data")
        .upsert(record)
        .select()
      if (error)
        DevLog(
          "Interceptor.background.processRecordsIndexDB_error - " +
            JSON.stringify(error),
          "warn"
        )
      await processType(record.type, record.data,record.user_id)
      //await indexDB.tweets.put({ ... tweet}, tweet.rest_id);
      const localDbUpdates = await indexDB.data.update(record, {
        timestamp: newDate,
        ...record
      })
      DevLog(
        "Interceptor.background.processRecordsIndexDB - localDbUpdates:" +
          localDbUpdates
      )
      // Mark the tweet as saved after processing
      //await tweetStorage.markAsSaved(tweet.id)
      DevLog(
        "Interceptor.background.processRecordsIndexDB - record saved:" +
          record.item_id
      )
    } catch (error) {
      DevLog(
        "Interceptor.background.processRecordsIndexDB - Error processing record:" +
          error
      )
    }
  }
  if (process.env.NODE_ENV === 'development') {
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    DevLog(
      "Interceptor.background.processRecordsIndexDB - Processing completed in " +
        processingTime.toFixed(2) + 
        "ms"
    )
  }
}

/*async function processType(type: string, data: any) {
  if(type == "home-timeline") {

      try {
        const itemToProccess = data as Tweet;
        DevLog("Interceptor.background.process.home-timeline - Processing tweet:" + itemToProccess.rest_id)

        const account = TwitterDataMapper.mapAccount(itemToProccess);
        const profile = TwitterDataMapper.mapProfile(itemToProccess);
        const tweet = TwitterDataMapper.mapTweet(itemToProccess, null);

        let objToInsert : TimedObject = {
          timestamp: new Date().toISOString(),
          type: "account",
          id: account.account_id,
          data: account
        } 
        const {data: accountData,error: accountError} = await supabase.from("temporary_data").upsert(objToInsert).select()
        //const {data: accountData,error: accountError} = await supabase.from("account").insert(account).select()
        if(accountError)
          DevLog(JSON.stringify(accountError))

        objToInsert = { 
          timestamp: new Date().toISOString(),
          type: "profile",
          id: profile.account_id,
          data: profile
        } 
        const {data: profileData,error: profileError} = await supabase.from("temporary_data").upsert(objToInsert).select()
        if(profileError)
          DevLog(JSON.stringify(profileError))

       //const {data: accounttData,error: accounttError} = await supabase.from("account").upsert(account).select()
       //if(accounttError)
       //  DevLog(JSON.stringify(accounttError))

       //const {data: profiletData,error: profiletError} = await supabase.from("profile").upsert(profile).select()
       //if(profiletError)
       //  DevLog(JSON.stringify(profiletError))

        objToInsert = { 
          timestamp: new Date().toISOString(),
          type: "tweet",
          id: tweet.tweet_id,
          data: tweet
        } 
        const {data: tweetData,error: tweetError} = await supabase.from("temporary_data").upsert(objToInsert).select()
        if(tweetError)
          DevLog(JSON.stringify(tweetError))

      } catch (error) {
        DevLog("Interceptor.background.process.home-timeline - Error processing tweet:" + error)
      }
    
  } else if(type == "user-tweets") {
    try {
      const itemToProccess = data as Tweet;
      DevLog("Interceptor.background.process.home-timeline - Processing tweet:" + itemToProccess.rest_id)

      const account = TwitterDataMapper.mapAccount(itemToProccess);
      const profile = TwitterDataMapper.mapProfile(itemToProccess);
      const tweet = TwitterDataMapper.mapTweet(itemToProccess, null);

      let objToInsert : TimedObject = {
        timestamp: new Date().toISOString(),
        type: "account",
        id: account.account_id,
        data: account
      } 
      const {data: accountData,error: accountError} = await supabase.from("temporary_data").upsert(objToInsert).select()
      //const {data: accountData,error: accountError} = await supabase.from("account").insert(account).select()
      if(accountError)
        DevLog(JSON.stringify(accountError))

      objToInsert = { 
        timestamp: new Date().toISOString(),
        type: "profile",
        id: profile.account_id,
        data: profile
      } 
      const {data: profileData,error: profileError} = await supabase.from("temporary_data").upsert(objToInsert).select()
      if(profileError)
        DevLog(JSON.stringify(profileError))

     //const {data: accounttData,error: accounttError} = await supabase.from("account").upsert(account).select()
     //if(accounttError)
     //  DevLog(JSON.stringify(accounttError))

     //const {data: profiletData,error: profiletError} = await supabase.from("profile").upsert(profile).select()
     //if(profiletError)
     //  DevLog(JSON.stringify(profiletError))

      objToInsert = { 
        timestamp: new Date().toISOString(),
        type: "tweet",
        id: tweet.tweet_id,
        data: tweet
      } 
      const {data: tweetData,error: tweetError} = await supabase.from("temporary_data").upsert(objToInsert).select()
      if(tweetError)
        DevLog(JSON.stringify(tweetError))

    } catch (error) {
      DevLog("Interceptor.background.process.home-timeline - Error processing tweet:" + error)
    }

    DevLog("Interceptor.background.process.user-tweets - Processing tweet:" + data.rest_id)
  }
}*/

async function processType(type: string, data: any, userid: string) {
  try {
    
    

    switch(type) {
      case "tweet-detail":
      case "home-timeline":
      case "user-tweets":
        const itemToProccess = data as Tweet
        DevLog(
          "Interceptor.background.process.home-timeline - Processing tweet:" +
            itemToProccess.rest_id
        )
        if(itemToProccess.core.user_results.result.legacy.protected) {
          DevLog("Interceptor.background.process.home-timeline - Skipping protected account:" + itemToProccess.rest_id)
          return;
        }
        
        processTweet(itemToProccess, userid)
        break;
      
      case "following":
      case "followers":

        const userToProcess = data as User
        processUser(userToProcess)
        break;
    }
   
  } catch (error) {
    DevLog(`Interceptor.background.process.${type} - Error processing tweet:${error}`)
  }
  
}

async function processUser(data: User) {
  DevLog(
    "Interceptor.background.process_user - Starting with data: " +
      JSON.stringify(data)
  )
}

async function processTweet(data: Tweet, userid: string) {
  DevLog(
    "Interceptor.background.process_json - Starting with data: " +
      JSON.stringify(data)
  )

  const items = TwitterDataMapper.mapAll(data)
  DevLog("got " + items.length + " items in processJSON", items)
  let originator_id = data.rest_id 
  for (let i=0;i<items.length;i++) {
    const item = items[i];
    DevLog(item)
    const { account, profile, tweet, media, urls, mentions } = item
    
    // Account
    let objToInsert: TimedObject = {
      timestamp: new Date().toISOString(),
      type: "account",
      item_id: account.account_id,
      originator_id: originator_id,
      user_id: userid,
      data: account
    }
    DevLog(
      "Interceptor.background.process_account - Processing account: " +
        account.account_id
    )
    const { data: accountData, error: accountError } = await supabase
      .from("temporary_data")
      .upsert(objToInsert)
      .select()
    if (accountError) {
      DevLog(
        "Interceptor.background.process_account_error - " +
          JSON.stringify(accountError),
        "warn"
      )
    }

    // Profile
    objToInsert = {
      timestamp: new Date().toISOString(),
      type: "profile",
      item_id: profile.account_id,
      originator_id: originator_id,
      user_id: userid,
      data: profile
    }
    DevLog(
      "Interceptor.background.process_profile - Processing profile: " +
        profile.account_id
    )
    const { data: profileData, error: profileError } = await supabase
      .from("temporary_data")
      .upsert(objToInsert)
      .select()
    if (profileError) {
      DevLog(
        "Interceptor.background.process_profile_error - " +
          JSON.stringify(profileError),
        "warn"
      )
    }

    // Tweet
    objToInsert = {
      timestamp: new Date().toISOString(),
      type: "tweet",
      item_id: tweet.tweet_id,
      originator_id: originator_id,
      user_id: userid,
      data: tweet
    }
    DevLog(
      "Interceptor.background.process_tweet - Processing tweet: " +
        tweet.tweet_id
    )
    const { data: tweetData, error: tweetError } = await supabase
      .from("temporary_data")
      .upsert(objToInsert)
      .select()
    if (tweetError) {
      DevLog(
        "Interceptor.background.process_tweet_error - " +
          JSON.stringify(tweetError),
        "warn"
      )
    }

    // Media
    if (media) {
      DevLog(
        "Interceptor.background.process_media - Processing " +
          media.length +
          " media items"
      )
      for (const m of media) {
        objToInsert = {
          timestamp: new Date().toISOString(),
          type: "media",
          item_id: m.media_id.toString(),
          originator_id: originator_id,
          user_id: userid,
          data: m
        }
        DevLog(
          "Interceptor.background.process_media - Processing media: " +
            m.media_id
        )
        const { data: mediaData, error: mediaError } = await supabase
          .from("temporary_data")
          .upsert(objToInsert)
          .select()
        if (mediaError) {
          DevLog(
            "Interceptor.background.process_media_error - " +
              JSON.stringify(mediaError),
            "warn"
          )
        }
      }
    }

    // URLs
    if (urls) {
      DevLog(
        "Interceptor.background.process_url - Processing " +
          urls.length +
          " URLs"
      )
      for (const u of urls) {
        objToInsert = {
          timestamp: new Date().toISOString(),
          type: "url",
          item_id: u.tweet_id.toString(),
          originator_id: originator_id,
          user_id: userid,
          data: u
        }
        DevLog(
          "Interceptor.background.process_url - Processing URL for tweet: " +
            u.tweet_id
        )
        const { data: urlData, error: urlError } = await supabase
          .from("temporary_data")
          .upsert(objToInsert)
          .select()
        if (urlError) {
          DevLog(
            "Interceptor.background.process_url_error - " +
              JSON.stringify(urlError),
            "warn"
          )
        }
      }
    }

    // Mentions
    if (mentions) {
      DevLog(
        "Interceptor.background.process_mention - Processing " +
          mentions.length +
          " mentions"
      )
      for (const m of mentions) {
        objToInsert = {
          timestamp: new Date().toISOString(),
          type: "mention",
          item_id: m.mentioned_user_id,
          originator_id: originator_id,
          user_id: userid,
          data: m
        }
        DevLog(
          "Interceptor.background.process_mention - Processing mention: " +
            m.mentioned_user_id
        )
        const { data: mentionData, error: mentionError } = await supabase
          .from("temporary_data")
          .upsert(objToInsert)
          .select()
        if (mentionError) {
          DevLog(
            "Interceptor.background.process_mention_error - " +
              JSON.stringify(mentionError),
            "warn"
          )
        }
      }
    }
  }

  DevLog("Interceptor.background.process_json - Completed processing")
}

//async function processTweetsIndexDB() {
//
//  const tweets = await indexDB.tweets.filter(tweet => tweet.timestamp == null).toArray();
//  DevLog("FromIndexDB:" + await indexDB.tweets.count())
//  DevLog("FromIndexDB:" + JSON.stringify(tweets))
//  DevLog("Processing " + tweets.length + " tweets")
//
//  for (const tweet of tweets) {
//    try {
//      if(tweet.timestamp != null)
//        continue;
//      // For now, processing is just logging the tweet
//      const itemToInsert = TwitterDataMapper.mapTweet(tweet, null);
//      DevLog("Processing tweet:" + itemToInsert.tweet_id)
//
//
//
//
//      const {data,error} = await supabase.from("import_tweets").upsert(itemToInsert).select()
//      if(error)
//        DevLog(JSON.stringify(error))
//
//      //await indexDB.tweets.put({ ... tweet}, tweet.rest_id);
//      await indexDB.tweets.update(tweet.rest_id,{timestamp: new Date().getTime()})
//      // Mark the tweet as saved after processing
//      //await tweetStorage.markAsSaved(tweet.id)
//      DevLog("Tweet saved:" + itemToInsert.tweet_id)
//    } catch (error) {
//      DevLog("Error processing tweet:" + error)
//    }
//  }
//}
//
//

// Run processTweets every 10 minutes
//setInterval(processTweets, 1 * 35 * 1000)
const interval = parseInt(process.env.BACKGROUND_PROCESS_UPLOAD_DATA_INTERVAL_MS || "60000")
setInterval(processRecordsIndexDB, interval);
// Initial run
//processTweets()
