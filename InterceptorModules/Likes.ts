import type { Interceptor } from "./types/General";
import type { Tweet } from "./types/tweet";
import type { TimelineInstructions } from "./types";
import { extractTimelineTweet } from "~utils/twe_utils";
import { extractDataFromResponse } from "~utils/twe_utils";
import { db } from "~database";

export interface LikesResponse {
    data: {
      user: {
        result: {
          timeline_v2: {
            timeline: {
              instructions: TimelineInstructions;
              responseObjects: unknown;
            };
          };
          __typename: 'User';
        };
      };
    };
  }
  
  // https://twitter.com/i/api/graphql/lVf2NuhLoYVrpN4nO7uw0Q/Likes
  export const LikesInterceptor: Interceptor =  (req, res) => {
    if (!/\/graphql\/.+\/Likes/.test(req.url)) {
      return;
    }
    console.log("LikesInterceptor was called")
    try {
      const newData = extractDataFromResponse<LikesResponse, Tweet>(
        res,
        (json) => json.data.user.result.timeline_v2.timeline.instructions,
        (entry) => extractTimelineTweet(entry.content.itemContent),
      );
  

      // Dispatch a custom event
    for(const tweet of newData) {
      console.log("Sending intercepted data to IndexDB:", tweet.rest_id)
      window.dispatchEvent(new CustomEvent('dataInterceptedEvent', { detail: {data:tweet, type: "likes", originator_id: tweet.rest_id, item_id: tweet.rest_id }}));
    }
      console.log('TTT Likes: ', JSON.stringify(newData, null, 2))
      

      // Add captured data to the database.
      //db.extAddTweets("likes", newData);
      //console.log("Likes added from interceptor");
      
      console.log(`TTT Likes: ${newData.length} items received`);
    } catch (err) {
      console.log("LikesInterceptor failed", err)
      //logger.debug(req.method, req.url, res.status, res.responseText);
      //logger.errorWithBanner('Likes: Failed to parse API response', err as Error);
    }
  };