import { Storage } from "@plasmohq/storage"
import SwitchPreference from "~components/Preferences/PreferenceSwitch";
import type { ScrapedTweet } from "~contents/scrapeTweet";
import { supabase } from "~core/supabase";
import type { Tweet } from "~InterceptorModules/types";
import { DevLog, isDev } from "~utils/devUtils";


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
  enableSignalBoostingUrls: boolean
  blurViralTweets: boolean
  enhanceLongTweetText: boolean,
  scrapeData: boolean
}
export interface PreferenceMetadata {
  preference: keyof TweetEnhancementPreferences;
  title: string;
  subtitle: string;
  isEnabled: boolean;
}
export class TweetEnhancementPreferencesManager {
  private static readonly defaultPreferences: TweetEnhancementPreferences = {
    obfuscateAllUsers: false,
    showRelationshipBadges: false,
    showOriginalPosterBadge: false,
    enableSignalBoostingUrls: false,
    blurViralTweets: false,
    enhanceLongTweetText: true,
    scrapeData: true
  };

  static getDefaultPreferences(): TweetEnhancementPreferences {
    return { ...this.defaultPreferences };
  }

  static getPreferenceMetadata(): PreferenceMetadata[] {
    return [
      {
        preference: "obfuscateAllUsers",
        title: "Obfuscate All Users",
        subtitle: "Hide usernames and display names for all users",
        isEnabled: true
      },
      {
        preference: "showRelationshipBadges",
        title: "Show Relationship Badges",
        subtitle: "Display badges indicating your relationship with other users",
        isEnabled: true
      },
      {
        preference: "showOriginalPosterBadge",
        title: "Show Original Poster Badge",
        subtitle: "Highlight the original poster in thread discussions",
        isEnabled: true
      },
      {
        preference: "blurViralTweets",
        title: "Blur Viral Tweets",
        subtitle: "Blur tweets that have more than 100k likes",
        isEnabled: true
      },
      {
        preference: "enableSignalBoostingUrls",
        title: "Enable Signal Boosting URLs",
        subtitle: "Allow sharing links through signal boosting features",
        isEnabled: isDev
      },
      {
        preference: "enhanceLongTweetText",
        title: "Enhance Tweet with LongTweet Text",
        subtitle: "Stop clicking on 'Show more' to read long tweets, activate this to automatically expand long tweets",
        isEnabled: true
      },
      {
        preference: "scrapeData",
        title: "Scrape Data",
        subtitle: "Scrape data from X api responses and send them to Community Archive. This is useful to keep the archive as up to date as possible.",
        isEnabled: true
      }
    ];
  }
}




const defaultPreferences = TweetEnhancementPreferencesManager.getDefaultPreferences()

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
      const prefs = Object.keys(defaultPreferences).reduce((acc, key) => ({
        ...acc,
        [key]: savedPrefs?.[key] ?? defaultPreferences[key]
      }), {} as TweetEnhancementPreferences);

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
      

      // Clear the in-memory cache to force a fresh load
      delete CachedData.inMemoryCache[CachedData.PREFERENCES_KEY];
      
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
  private static readonly MOOTS_KEY = "userMoots_"
  private static readonly FOLLOWERS_KEY = "userFollowers_"
  private static readonly FOLLOWS_KEY = "userFollows_"
  private static readonly TEXT_REPLACEMENET_KEY = "textReplacements"
  private static readonly CAN_SCRAPE_KEY = "canScrape"


  private static inMemoryCache: { [key: string]: TimedData<any> } = {}; // Use 'any' for generic types

  // Add a new property to track pending requests
  private static pendingRequests: { [key: string]: Promise<any> } = {};

  // Generic fetch and cache method
  private async fetchAndCache<T>(key: string, fetchFunction: ( ) => Promise<T>, cache_expiration_in_ms:number = CachedData.CACHE_EXPIRATION): Promise<T> {
    // First check in-memory cache
    
    const cachedData = CachedData.inMemoryCache[key];
    if (cachedData && cachedData.last_updated >= Date.now() - cache_expiration_in_ms) {
      DevLog(`Cache hit for key: ${key}`);
      return cachedData.data;
    }

    
  const storedData = await CachedData.storage.get<TimedData<T>>(key);
  if (storedData && storedData.last_updated >= Date.now() - cache_expiration_in_ms) {
    DevLog(`Storage cache hit for key: ${key}`);
    // Update in-memory cache with storage data
    CachedData.inMemoryCache[key] = storedData;
    return storedData.data;
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

  async GetCanScrape(userid: string): Promise<boolean> {
    const key = CachedData.CAN_SCRAPE_KEY + userid;
    return this.fetchAndCache<boolean>(key, async () => {
      const {data, error} = await supabase.schema("tes").from("blocked_scraping_users").select("*").eq("account_id", userid)
      if(error) throw error
      return data.length==0
    }, 45 * 1000)
  }

  async GetMoots(userid: string): Promise<User[]> {
    const key = CachedData.MOOTS_KEY + userid;
    return this.fetchAndCache<User[]>(key, async () => {
        const { data, error } = await supabase.rpc("tes_get_moots", { user_id: userid });
        if (error) throw error;
        return data.map(moot => ({ user_id: moot.user_id, username: moot.username }));
    });
}

  async GetFollowers(userid : string) :Promise<User[]>{
    const key = CachedData.FOLLOWERS_KEY + userid
   return this.fetchAndCache<User[]>(key, async () => {
      const {data, error} = await supabase.rpc("tes_get_followers", {user_id: userid})
      if(error) throw error
      return data.map(follower => ({user_id: follower.user_id, username: follower.username}))
    })
  }
  async GetFollows(userid : string) :Promise<User[]>{
    const key = CachedData.FOLLOWS_KEY + userid
    return this.fetchAndCache<User[]>(key, async () => {
      const {data, error} = await supabase.rpc("tes_get_followings", {user_id: userid})
      if(error) throw error
      return data.map(following => ({user_id: following.user_id, username: following.username}))
    })
  }

  async GetTextModifiers() : Promise<TextModifier[]>{
    const key = CachedData.TEXT_REPLACEMENET_KEY
    return this.fetchAndCache<TextModifier[]>(key, async () => {
      const textModifiers = await CachedData.storage.get<TimedData<TextModifier[]>>(CachedData.TEXT_REPLACEMENET_KEY)
      if(!textModifiers) return []
      return textModifiers.data;
    })
  }

  async SetTextModifiers(modifiers: TextModifier[]){
    await CachedData.storage.set(CachedData.TEXT_REPLACEMENET_KEY, modifiers)
    CachedData.inMemoryCache[CachedData.TEXT_REPLACEMENET_KEY] = {
      data: modifiers,
      last_updated: Date.now()
    }
  }

  private async ResetCacheWithKey(key:string) {
    const allKeys = await CachedData.storage.getAll()
    const cacheSelectedKeys = Object.keys(allKeys).filter(allKey => allKey.startsWith(key))
    await Promise.all(cacheSelectedKeys.map(key => CachedData.storage.remove(key)))
  }
  async ResetAllCache(){
    await this.ResetCacheWithKey(CachedData.MOOTS_KEY)
    await this.ResetCacheWithKey(CachedData.USERDATA_KEY)
    await this.ResetCacheWithKey(CachedData.FOLLOWERS_KEY)
    await this.ResetCacheWithKey(CachedData.FOLLOWS_KEY)
  }
}

export interface TextModifier{
  from: string,
  to: string
}

//export default CachedData


export const GlobalCachedData = new CachedData()