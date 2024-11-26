import { Storage } from "@plasmohq/storage"
import type { ScrapedTweet } from "~contents/scrapeTweet";
import { supabase } from "~core/supabase";
import { DevLog } from "~utils/devUtils";


export interface UserData {
    account_id: string,
    username: string,
    display_name: string,
    avatar_media_url: string,
    header_media_url: string,
    num_tweets: number,
    num_following: number,
    num_followers: number,
    num_likes: number
}

export interface TimedData<T>{
    data: T,
    last_updated: number
}


export interface User{
    user_id: string,
    username: string
}


export interface TweetEnhancementPreferences {
  obfuscateAllUsers: boolean
  showRelationshipBadges: boolean
  showOriginalPosterBadge: boolean
}

const defaultPreferences: TweetEnhancementPreferences = {
  obfuscateAllUsers: false,
  showRelationshipBadges: false,
  showOriginalPosterBadge: false
}

class CachedData {
  private static readonly PREFERENCES_KEY = "tweetEnhancementPreferences";

  async GetEnhancementPreferences(): Promise<TweetEnhancementPreferences> {
    try {
      // Check in-memory cache first
      const cachedPrefs = CachedData.inMemoryCache[CachedData.PREFERENCES_KEY];
      if (cachedPrefs && cachedPrefs.last_updated >= Date.now() - CachedData.CACHE_EXPIRATION) {
        return cachedPrefs.data;
      }

      // If not in memory, get from storage
      const savedPrefs = await CachedData.storage.get<TweetEnhancementPreferences>(CachedData.PREFERENCES_KEY);
      const prefs = savedPrefs || defaultPreferences;

      // Update in-memory cache
      CachedData.inMemoryCache[CachedData.PREFERENCES_KEY] = {
        data: prefs,
        last_updated: Date.now()
      };

      return prefs;
    } catch (error) {
      console.error('Error getting enhancement preferences:', error);
      return defaultPreferences;
    }
  }

  async SaveEnhancementPreferences(newPreferences: TweetEnhancementPreferences): Promise<void> {
    try {
      // Update storage
      await CachedData.storage.set(CachedData.PREFERENCES_KEY, newPreferences);
      
      // Update in-memory cache
      CachedData.inMemoryCache[CachedData.PREFERENCES_KEY] = {
        data: newPreferences,
        last_updated: Date.now()
      };

      DevLog(`Saved enhancement preferences: ${JSON.stringify(newPreferences)}`);
    } catch (error) {
      console.error('Error saving enhancement preferences:', error);
      throw error;
    }
  }

  private static readonly CACHE_EXPIRATION = 1000 * 60 * 60 * 24; // 24 hours

  private static storage: Storage = new Storage({
    area: "local"
  })

  private static readonly USERDATA_KEY = "userData_"
  private static readonly moots = "userMoots_"
  private static readonly followers = "userFollowers_"
  private static readonly follows = "userFollows_"
  


  private static inMemoryCache: { [key: string]: TimedData<any> } = {}; // Use 'any' for generic types

  // Add a new property to track pending requests
  private static pendingRequests: { [key: string]: Promise<any> } = {};

  // Generic fetch and cache method
  private async fetchAndCache<T>(key: string, fetchFunction: () => Promise<T>): Promise<T> {
    // First check in-memory cache
    const cachedData = CachedData.inMemoryCache[key];
    if (cachedData && cachedData.last_updated >= Date.now() - CachedData.CACHE_EXPIRATION) {
      DevLog(`Cache hit for key: ${key}`);
      return cachedData.data;
    }

    // If there's already a pending request for this key, return its promise
    if (CachedData.pendingRequests[key]) {
      DevLog(`Request already pending for key: ${key}`);
      return CachedData.pendingRequests[key];
    }

    // Create new request promise
    DevLog(`Cache miss for key: ${key}, fetching from Supabase`);
    CachedData.pendingRequests[key] = (async () => {
      try {
        const data = await fetchFunction();
        const res: TimedData<T> = { data, last_updated: Date.now() };
        await CachedData.storage.set(key, res);
        CachedData.inMemoryCache[key] = res;
        return data;
      } finally {
        // Clean up pending request after completion (success or failure)
        delete CachedData.pendingRequests[key];
      }
    })();

    return CachedData.pendingRequests[key];
  }

  async GetUserData(id:string) : Promise<UserData> {
    const userData = await CachedData.storage.get<TimedData<UserData>>(CachedData.USERDATA_KEY + id)

    if (CachedData.inMemoryCache[CachedData.USERDATA_KEY + id]) {
      return CachedData.inMemoryCache[CachedData.USERDATA_KEY + id].data;
    }

    if(!userData || userData.last_updated < Date.now() - 1000 * 60 * 60 * 24){
        const {data : acc_data, error} = await supabase.from("account").select("*").eq("account_id", id)
        if(error) throw error

        const {data :profile_data, error : profile_error} = await supabase.from("profile").select("*").eq("account_id", id)
        if(profile_error) throw profile_error

        const res: TimedData<UserData> ={
            data:{account_id: acc_data[0].account_id,
            username: acc_data[0].username,
            display_name: profile_data[0].display_name,
            avatar_media_url: profile_data[0].avatar_media_url,
            header_media_url: profile_data[0].header_media_url,
            num_tweets: acc_data[0].num_tweets,
            num_following: acc_data[0].num_following,
            num_followers: acc_data[0].num_followers,
            num_likes: acc_data[0].num_likes},
            last_updated: Date.now()
        }
        await CachedData.storage.set(CachedData.USERDATA_KEY + id, res)
        return res.data;
    }
    return userData.data;
  }


  async GetMoots(userid: string): Promise<User[]> {
    const key = CachedData.moots + userid;
    return this.fetchAndCache<User[]>(key, async () => {
        const { data, error } = await supabase.rpc("tes_get_moots", { user_id: userid });
        if (error) throw error;
        return data.map(moot => ({ user_id: moot.user_id, username: moot.username }));
    });
}

  async GetFollowers(userid : string) :Promise<User[]>{
    const key = CachedData.followers + userid
   return this.fetchAndCache<User[]>(key, async () => {
      const {data, error} = await supabase.rpc("tes_get_followers", {user_id: userid})
      if(error) throw error
      return data.map(follower => ({user_id: follower.user_id, username: follower.username}))
    })
  }
  async GetFollows(userid : string) :Promise<User[]>{
    const key = CachedData.follows + userid
    return this.fetchAndCache<User[]>(key, async () => {
      const {data, error} = await supabase.rpc("tes_get_followings", {user_id: userid})
      if(error) throw error
      return data.map(following => ({user_id: following.user_id, username: following.username}))
    })
  }
  private async ResetCacheWithKey(key:string) {
    const allKeys = await CachedData.storage.getAll()
    const cacheSelectedKeys = Object.keys(allKeys).filter(allKey => allKey.startsWith(key))
    await Promise.all(cacheSelectedKeys.map(key => CachedData.storage.remove(key)))
  }
  async ResetAllCache(){
    await this.ResetCacheWithKey(CachedData.moots)
    await this.ResetCacheWithKey(CachedData.USERDATA_KEY)
    await this.ResetCacheWithKey(CachedData.followers)
    await this.ResetCacheWithKey(CachedData.follows)
  }
}


export default CachedData


export const GlobalCachedData = new CachedData()