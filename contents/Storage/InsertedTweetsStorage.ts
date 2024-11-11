import { Storage } from "@plasmohq/storage"
import { Mutex } from "async-mutex"
import { DevLog } from "~utils/devUtils"


interface InsertedTweet {
  id: string
  insertedDate: Date | null
}

class InsertedTweetStorage {
  private storage: Storage
  private readonly TWEETS_KEY = "insertedTweets_"
  private static mutex = new Mutex();
  constructor() {
    this.storage = new Storage({
      area: "local"
    })
  }

  private async getTweets(): Promise<InsertedTweet[]> {
    const keys = await this.storage.getAll();
    const tweets: InsertedTweet[] = [];
    for (const key in keys) {
      if (key.startsWith(this.TWEETS_KEY)) {
        tweets.push(await this.storage.get<InsertedTweet>(key));
      }
    }
    return tweets;
  }

  private async saveTweet(tweet: InsertedTweet): Promise<void> {
    const date = new Date();
    
      tweet.insertedDate = tweet.insertedDate ?? date
     
    await this.storage.set(this.TWEETS_KEY+tweet.id, tweet)
  }

  async addTweet(tweet: InsertedTweet): Promise<void> {


      await this.saveTweet(tweet)

      DevLog("Inserted tweet " + tweet.id, "info")
    

  }

  async removeTweet(id: string): Promise<void> {
    this.storage.remove(this.TWEETS_KEY+id)
  }

  async getTweet(id: string): Promise<InsertedTweet | undefined> {
    return await this.storage.get<InsertedTweet>(this.TWEETS_KEY+id)
  }

  async removeAllTweets(): Promise<void> {
    const keys = await this.storage.getAll();
    for (const key in keys) {
      if (key.startsWith(this.TWEETS_KEY)) {
        await this.storage.remove(key);
      }
    }
  }
//remove tweets with more than 2 days old
  async removeOldTweets(date: Date): Promise<void> {
    const tweets = await this.getTweets()
    const twoDaysAgo = new Date(date.getTime() - 2 * 24 * 60 * 60 * 1000)
    for (const tweet of tweets) {
        if (tweet && tweet.insertedDate && tweet.insertedDate < twoDaysAgo) {
          await this.storage.remove(tweet.id);
        }
  }
  }

  async getAllTweets(): Promise<InsertedTweet[]> {
    return await this.getTweets();
  }
}

export default InsertedTweetStorage