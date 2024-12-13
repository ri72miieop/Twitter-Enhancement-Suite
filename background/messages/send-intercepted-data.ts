import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { UserMinimal } from "~utils/dbUtils"

import { supabase } from "~core/supabase"
import type { Tweet } from "~InterceptorModules/types/tweet"
import { getUser } from "~utils/dbUtils"

import { DevLog, PLASMO_PUBLIC_RECORD_EXPIRY_SECONDS } from "~utils/devUtils"
import { indexDB } from "~utils/IndexDB"
import type { User } from "~InterceptorModules/types/user"
import { GlobalCachedData } from "~contents/Storage/CachedData"



//const processFunctions ={
//  tweets: processInterceptedTweet,
//  bookmarks: processInterceptedBookmarks,
//  homeTimeline: processInterceptedTweet,
//  following: processInterceptedFollowing
//}


const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    
 

   const type = req.body.type;
 console.log("Interceptor.background.message - send-intercepted-data: Received intercepted data:", req.body)

 console.log("Interceptor.background.message - send-intercepted-data: Sending intercepted data to IndexDB:", req.body.originator_id)
 
   try {
       //const functionToCall = processFunctions[type]
       //if(!functionToCall) throw new Error(`No function to call for type: ${type}`)
        
       console.log("Interceptor.background.message - send-intercepted-data: Sending intercepted data to IndexDB:", req.body.originator_id)
       await processInterceptedData(req.body.data, type, req.body.originator_id,req.body.item_id, req.body.userid);
       //await functionToCall(req.body.data, type, user);
       
     res.send({ success: true });
   } catch (error) {
     console.log(`Error sending ${type}: ${error.message}`, "error"); 
     res.send({ success: false, error: error.message });
   }
 
}



async function processInterceptedData(data:string, type: string, originator_id: string, item_id: string, userid: string){

  console.log("got data",originator_id)

  // Check for existing records in IndexDB
  const existingRecords = (await indexDB.data
    .filter(record => 
      record.originator_id === originator_id && 
      record.item_id === item_id && 
      record.type === type
    ).sortBy("timestamp"))
    .reverse();
  const expirySeconds = PLASMO_PUBLIC_RECORD_EXPIRY_SECONDS;
  const expiryTime = Date.now() - expirySeconds  * 1000;
  //if (existingRecords.length > 0) {
  //  const mostRecent = existingRecords[0];
  //  if (mostRecent.timestamp) {
  //    const recordTime = new Date(mostRecent.timestamp).getTime();
  //    
  //    
  //    if (recordTime > expiryTime) {
  //      console.log(`Interceptor.background.message.expiry - send-intercepted-data: new record is less than ${expirySeconds} seconds old, skipping:`, originator_id);
  //      return;
  //    }
  //  }
  //}

  
  const { data:dbdata, error } = await supabase.from("temporary_data").select("originator_id,item_id,timestamp").eq("originator_id", originator_id).eq("item_id", item_id).eq("type", type).order("timestamp",{ascending:false, nullsFirst:false}).limit(1);
  if(dbdata && dbdata.length > 0 && dbdata[0].timestamp && new Date(dbdata[0].timestamp).getTime() > expiryTime) {
    console.log(`Interceptor.background.message.expiry - send-intercepted-data: new record is less than ${expirySeconds} seconds old on DB, skipping record: ${originator_id}`)
    return;
  }
  indexDB.data.put( {timestamp: null, type: type, originator_id: originator_id, item_id: item_id, data: data, user_id: userid});

  DevLog("data saved to IndexDB from RELAY:" + originator_id)
}


//async function processInterceptedTweet(tweet: Tweet, type: string, user: UserMinimal){
//
//  console.log("got tweet",tweet.rest_id)
//  indexDB.tweets.put( {timestamp: null, ...tweet}, tweet.rest_id);
//
//      console.log("tweet saved to IndexDB from RELAY:" + tweet.rest_id)
//}
//
//async function processInterceptedBookmarks(tweet: Tweet, type: string, user: UserMinimal){
//
//  console.log("got tweet",tweet.rest_id)
//  indexDB.bookmarks.put( {timestamp: null, ...tweet, user_id: user.id}, tweet.rest_id);
//
//      console.log("tweet saved to IndexDB from RELAY:" + tweet.rest_id)
//}
//
//async function processInterceptedFollowing(user: User, type: string, userMinimal : UserMinimal){
//  console.log("got user",user.rest_id)
//  indexDB.users.put( {timestamp: null, ...user}, user.rest_id);
//
//      console.log("user saved to IndexDB from RELAY:" + user.rest_id)
//}



export default handler
