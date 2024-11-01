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


export interface Moot{
    user_id: string,
    username: string
}

class CachedData {
  private static storage: Storage = new Storage({
    area: "local"
  })

  private static readonly USERDATA_KEY = "userData_"
  private static readonly moots = "userMoots_"



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


  async GetMoots(userid : string) :Promise<Moot[]>{
   //const moots = await CachedData.storage.get<TimedData<Moot[]>>(CachedData.moots + userid)
   //if(!moots || moots.last_updated < Date.now() - 1000 * 60 * 60 * 24){
        const {data, error} = await supabase.rpc("get_moots", {user_id: userid})
        if(error) throw error

        const res: TimedData<Moot[]> = {data: data.map(moot => ({user_id: moot.user_id, username: moot.username})), last_updated: Date.now()}
        await CachedData.storage.set(CachedData.moots + userid, res)
        return res.data;
    //}
    //return moots.data;
  }
  private async ResetMootsCache(key:string) {
    const allKeys = await CachedData.storage.getAll()
    const mootsKeys = Object.keys(allKeys).filter(key => key.startsWith(key))
    await Promise.all(mootsKeys.map(key => CachedData.storage.remove(key)))
  }
  async ResetAllCache(){
    await this.ResetMootsCache(CachedData.moots)
    await this.ResetMootsCache(CachedData.USERDATA_KEY)
  }
}


export default CachedData


export const GlobalCachedData = new CachedData()