import { Storage } from "@plasmohq/storage"
import type { ScrapedTweet } from "../scrapeTweet"
import InsertedTweetStorage from "./InsertedTweetsStorage"
import { Mutex } from 'async-mutex';
class TweetStorage {
  private static storage: Storage = new Storage({
    area: "local"
  })
  private static readonly TWEETS_KEY = "tweets"

  private static updateTimeout: NodeJS.Timeout | null = null

  private static insertedTweetStorage: InsertedTweetStorage = new InsertedTweetStorage()
  private static mutex = new Mutex();

  private static invokeFunctions: (() => void)[] = []
  //constructor() {
  //  // Watch for storage changes
  //  TweetStorage.storage.watch({
  //    [TweetStorage.TWEETS_KEY]: () => {
  //      TweetStorage.resetCache()
  //    }
  //  })
  //}

  private static async getTweets(): Promise<ScrapedTweet[]> {
    return await TweetStorage.storage.get<ScrapedTweet[]>(TweetStorage.TWEETS_KEY)
  }

  //private static debouncedSaveTweets(): void {
  //  //if (TweetStorage.updateTimeout) {
  //  //  clearTimeout(TweetStorage.updateTimeout)
  //  //}
  //  //TweetStorage.updateTimeout = setTimeout(() => {
  //  //  TweetStorage.saveTweets()
  //  //}, 5000) // Delay of 5 seconds
//
  //  TweetStorage.saveTweets()
  //}

  //private static async saveTweets(): Promise<void> {
  //  
  //    await TweetStorage.storage.set(TweetStorage.TWEETS_KEY, TweetStorage.tweetsCache)
  //  
  //  console.log("saved tweets", TweetStorage.tweetsCache?.length)
  //}



  async addTweet(tweet: ScrapedTweet): Promise<void> {
    // Acquire the mutex lock

      const existingTweet = await TweetStorage.insertedTweetStorage.getTweet(tweet.id);
      if (!existingTweet || !existingTweet.insertedDate) {
        const release = await TweetStorage.mutex.acquire();
        try {
          const tweets = await TweetStorage.getTweets();
          tweets.push(tweet);
          await TweetStorage.storage.set(TweetStorage.TWEETS_KEY, tweets);
          console.log(tweets.length, "->", "added tweet", tweet.id);
        
      } finally {
        // Always release the mutex lock
        release();
      }
    }
  }

  async markAsSaved(id: string): Promise<void> {
    const tweets = await TweetStorage.getTweets()
    // Update the cache with filtered tweets
    const updatedTweets = tweets.filter(tweet => tweet.id !== id)
    await TweetStorage.storage.set(TweetStorage.TWEETS_KEY, updatedTweets)
    await TweetStorage.insertedTweetStorage.addTweet({ id, insertedDate: new Date() })
  }

  async getTweet(id: string): Promise<ScrapedTweet | undefined> {
    const tweets = await TweetStorage.getTweets()
    return tweets.find(tweet => tweet.id === id)
  }

  async GetStatus(id:string) : Promise<"NOT_SAVED" | "SAVED" | "INSERTED">{
    
    const insertedTweet = await TweetStorage.insertedTweetStorage.getTweet(id)
    if(!insertedTweet || !insertedTweet.insertedDate){
      return "SAVED"
    }
    const tweet = await this.getTweet(id)
    if(!tweet){
      return "NOT_SAVED"
    }else{
      return "INSERTED"
    }
  }


  async inserted():Promise<number>{
    return (await TweetStorage.insertedTweetStorage.getAllTweets()).length
  }
  async getAllTweets(): Promise<ScrapedTweet[]> {
    // Reset cache before getting tweets to ensure fresh data
    //await TweetStorage.resetCache()
    return await TweetStorage.getTweets()
  }

  //static async saveAllChanges(): Promise<void> {
  //  if (TweetStorage.updateTimeout) {
  //    clearTimeout(TweetStorage.updateTimeout)
  //  }
  //  await TweetStorage.saveTweets()
  //}

  //private static async resetCache(): Promise<void> {
  //  TweetStorage.tweetsCache = null
  //}
}

export default TweetStorage
