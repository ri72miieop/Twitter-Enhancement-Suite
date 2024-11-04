import { Storage } from "@plasmohq/storage"
import type { ScrapedTweet } from "~contents/scrapeTweet";
import { supabase } from "~core/supabase";


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

class CachedData {
  
  private static storage: Storage = new Storage({
    area: "local"
  })

  private static readonly USERDATA_KEY = "userData_"
  private static readonly moots = "userMoots_"
  private static readonly followers = "userFollowers_"
  private static readonly follows = "userFollows_"



  async GetUserData(id:string) : Promise<UserData> {
    const userData = await CachedData.storage.get<TimedData<UserData>>(CachedData.USERDATA_KEY + id)

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


  async GetMoots(userid : string) :Promise<User[]>{
   //const moots = await CachedData.storage.get<TimedData<User[]>>(CachedData.moots + userid)
   //if(!moots || moots.last_updated < Date.now() - 1000 * 60 * 60 * 24){
        const {data, error} = await supabase.rpc("get_moots", {user_id: userid})
        if(error) throw error

        const res: TimedData<User[]> = {data: data.map(moot => ({user_id: moot.user_id, username: moot.username})), last_updated: Date.now()}
        await CachedData.storage.set(CachedData.moots + userid, res)
        return res.data;
    //}
    //return moots.data;
  }

  async GetFollowers(userid : string) :Promise<User[]>{
    //const followers = await CachedData.storage.get<TimedData<User[]>>(CachedData.followers + userid)
   //if(!followers || followers.last_updated < Date.now() - 1000 * 60 * 60 * 24){
      const {data, error} = await supabase.rpc("get_followers", {user_id: userid})
      if(error) throw error
      const res: TimedData<User[]> = {data: data.map(follower => ({user_id: follower.user_id, username: follower.username})), last_updated: Date.now()}
      await CachedData.storage.set(CachedData.followers + userid, res)
      return res.data;
    //}
    //return moots.data;
  }
  async GetFollows(userid : string) :Promise<User[]>{
    //const follows = await CachedData.storage.get<TimedData<User[]>>(CachedData.follows + userid)
   //if(!follows || follows.last_updated < Date.now() - 1000 * 60 * 60 * 24){
      const {data, error} = await supabase.rpc("get_followings", {user_id: userid})
      if(error) throw error
      const res: TimedData<User[]> = {data: data.map(following => ({user_id: following.user_id, username: following.username})), last_updated: Date.now()}
      await CachedData.storage.set(CachedData.follows + userid, res)
      return res.data;
    //}
    //return moots.data;
  }
  private async ResetCacheWithKey(key:string) {
    const allKeys = await CachedData.storage.getAll()
    const cacheSelectedKeys = Object.keys(allKeys).filter(key => key.startsWith(key))
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