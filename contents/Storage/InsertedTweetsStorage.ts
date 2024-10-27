import { Storage } from "@plasmohq/storage"
import { Mutex } from "async-mutex"


interface InsertedTweet {
  id: string
  insertedDate: Date | null
}

class InsertedTweetStorage {
  private storage: Storage
  private readonly TWEETS_KEY = "insertedTweets"
  private static mutex = new Mutex();
  constructor() {
    this.storage = new Storage({
      area: "local"
    })
  }

  private async getTweets(): Promise<InsertedTweet[]> {
    const tweets = await this.storage.get<InsertedTweet[]>(this.TWEETS_KEY)
    return tweets || []
  }

  private async saveTweets(tweets: InsertedTweet[]): Promise<void> {
    const date = new Date();
    tweets.forEach(tweet => {
      tweet.insertedDate = tweet.insertedDate ?? date
    })  
    await this.storage.set(this.TWEETS_KEY, tweets)
  }

  async addTweet(tweet: InsertedTweet): Promise<void> {

    const release = await InsertedTweetStorage.mutex.acquire();
    try {
      
      const tweets = await this.getTweets()
      tweets.push(tweet)
      await this.saveTweets(tweets)

      console.log("Inserted tweet", tweet.id)
    
  } finally {
    // Always release the mutex lock
    release();
  }
  }

  async removeTweet(id: string): Promise<void> {
    const tweets = await this.getTweets()
    const updatedTweets = tweets.filter(tweet => tweet.id !== id)
    await this.saveTweets(updatedTweets)
  }

  async getTweet(id: string): Promise<InsertedTweet | undefined> {
    const tweets = await this.getTweets()
    return tweets.find(tweet => tweet.id === id)
  }

  async removeAllTweets(): Promise<void> {
    await this.storage.remove(this.TWEETS_KEY)
  }
//remove tweets with more than 2 days old
  async removeOldTweets(date: Date): Promise<void> {
    const tweets = await this.getTweets()
    const twoDaysAgo = new Date(date.getTime() - 2 * 24 * 60 * 60 * 1000)
    const updatedTweets = tweets.filter(tweet => !tweet.insertedDate || tweet.insertedDate > twoDaysAgo)
    await this.saveTweets(updatedTweets)
  }

  async getAllTweets(): Promise<InsertedTweet[]> {
    return await this.getTweets()
  }
}

export default InsertedTweetStorage