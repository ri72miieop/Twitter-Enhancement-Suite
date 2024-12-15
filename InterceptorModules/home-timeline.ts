import { extractDataFromResponse, extractTimelineTweet } from "~utils/twe_utils";
import type { Interceptor } from "./types/General";
import type { TimelineInstructions, Tweet } from "./types";
import { DevLog } from "~utils/devUtils";


interface HomeTimelineResponse {
  data: {
    home: {
      home_timeline_urt: {
        instructions: TimelineInstructions;
        metadata: unknown;
        responseObjects: unknown;
      };
    };
  };
}

// https://twitter.com/i/api/graphql/uPv755D929tshj6KsxkSZg/HomeTimeline
// https://twitter.com/i/api/graphql/70b_oNkcK9IEN13WNZv8xA/HomeLatestTimeline
export const HomeTimelineInterceptor: Interceptor = (req, res) => {
  if (!/\/graphql\/.+\/Home(Latest)?Timeline/.test(req.url)) {
    return;
  }

  try {
    const newData = extractDataFromResponse<HomeTimelineResponse, Tweet>(
      res,
      (json) => json.data.home.home_timeline_urt.instructions,
      (entry) => extractTimelineTweet(entry.content.itemContent),
    );
    DevLog("Interceptor.function - HomeTimelineInterceptor: ", newData.length)
    
    // Dispatch a custom event
    for(const tweet of newData) {
      DevLog("Sending intercepted data to IndexDB:", tweet.rest_id)
      window.dispatchEvent(new CustomEvent('dataInterceptedEvent', { detail: {data:tweet, type: "home-timeline", originator_id: tweet.rest_id, item_id: tweet.rest_id }}));
    }
    DevLog('TTT HomeTimeline: ', JSON.stringify(newData, null, 2))
    DevLog(`TTT HomeTimeline: ${newData.length} items received`);
  } catch (err) {
    DevLog('TTT HomeTimeline: Failed to parse API response', err)
    //logger.debug(req.method, req.url, res.status, res.responseText);
    //logger.errorWithBanner('HomeTimeline: Failed to parse API response', err as Error);
  }
};
