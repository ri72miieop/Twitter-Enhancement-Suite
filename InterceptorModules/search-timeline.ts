import { extractDataFromResponse, extractTimelineTweet } from "~utils/twe_utils";
import type { Interceptor } from "./types/General";
import type { TimelineInstructions, Tweet } from "./types";
import { DevLog } from "~utils/devUtils";


interface SearchTimelineResponse {
  data: {
    search_by_raw_query: {
      search_timeline: {
        instructions: TimelineInstructions;
        responseObjects: unknown;
      };
    };
  };
}

// https://twitter.com/i/api/graphql/uPv755D929tshj6KsxkSZg/HomeTimeline
// https://twitter.com/i/api/graphql/70b_oNkcK9IEN13WNZv8xA/HomeLatestTimeline
export const SearchTimelineInterceptor: Interceptor = (req, res) => {
  if (!/\/graphql\/.+\/SearchTimeline/.test(req.url)) {
    return;
  }

  try {
    const newData = extractDataFromResponse<SearchTimelineResponse, Tweet>(
      res,
      (json) => json.data.search_by_raw_query.search_timeline.instructions,
      (entry) => extractTimelineTweet(entry.content.itemContent),
    );
    DevLog("Interceptor.function - SearchTimelineInterceptor: ", newData.length)
    
    // Dispatch a custom event
    for(const tweet of newData) {
      DevLog("Sending intercepted data to IndexDB:", tweet.rest_id)
      window.dispatchEvent(new CustomEvent('dataInterceptedEvent', { detail: {data:tweet, type: "search-timeline", originator_id: tweet.rest_id, item_id: tweet.rest_id }}));
    }
    DevLog('TTT HomeTimeline: ', JSON.stringify(newData, null, 2))
    DevLog(`TTT HomeTimeline: ${newData.length} items received`);
  } catch (err) {
    DevLog('TTT HomeTimeline: Failed to parse API response', err)
    //logger.debug(req.method, req.url, res.status, res.responseText);
    //logger.errorWithBanner('HomeTimeline: Failed to parse API response', err as Error);
  }
};
