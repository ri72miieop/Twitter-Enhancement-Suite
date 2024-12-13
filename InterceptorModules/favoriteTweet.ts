import type { Interceptor } from "./types/General";
import type { Tweet } from "./types/tweet";
import type { TimelineInstructions } from "./types";
import { extractTimelineTweet } from "~utils/twe_utils";
import { extractDataFromResponse } from "~utils/twe_utils";
import { db } from "~database";

export interface FavoriteTweetRequest {
    variables: {
      tweet_id: string,
      query_id: string
    };
  }

export interface FavoriteTweetResponse {
    data: {
      favorite_tweet: string
    };
  }

export interface UnfavoriteTweetResponse {
    data: {
      unfavorite_tweet: string
    };
  }
  
  // https://twitter.com/i/api/graphql/lVf2NuhLoYVrpN4nO7uw0Q/FavoriteTweet
  // https://twitter.com/i/api/graphql/lVf2NuhLoYVrpN4nO7uw0Q/UnfavoriteTweet
  export const FavoriteTweetInterceptor: Interceptor =  (req, res) => {
    if (!/.*\/graphql\/.+\/(Favorite|Unfavorite)Tweet/.test(req.url)) {
      return;
    }

    const isRemoveFavorite = req.url.toLowerCase().includes("unfavoritetweet");
    const reqBody = JSON.parse(req.body.toString()) as FavoriteTweetRequest;

    const item = isRemoveFavorite? res.response as UnfavoriteTweetResponse : res.response as FavoriteTweetResponse;
    console.log("REQUEST FAVORITS",JSON.stringify(req.body, null, 2))
    console.log("FavoriteTweetInterceptor was called")
    console.log("isRemoveFavorite", isRemoveFavorite)
    console.log("response",res.response)
    try {
    //  const newData = extractDataFromResponse<FavoriteTweetResponse, Tweet>(
    //    res,
    //    (json) => json.data.favorite_tweet,
    //    (entry) => extractTimelineTweet(entry.content.itemContent),
    //  );
  //
//
    //  // Dispatch a custom event
    //for(const tweet of newData) {
    //  console.log("Sending intercepted data to IndexDB:", tweet.rest_id)
    //  window.dispatchEvent(new CustomEvent('dataInterceptedEvent', { detail: {data:tweet, type: "likes", originator_id: tweet.rest_id, item_id: tweet.rest_id }}));
    //}
    //  console.log('TTT Likes: ', JSON.stringify(newData, null, 2))
      

      // Add captured data to the database.
      //db.extAddTweets("likes", newData);
      //console.log("Likes added from interceptor");
      
      console.log(`TTT Likes: {newData.length} items received`);
    } catch (err) {
      console.log("LikesInterceptor failed", err)
      //logger.debug(req.method, req.url, res.status, res.responseText);
      //logger.errorWithBanner('Likes: Failed to parse API response', err as Error);
    }
  };