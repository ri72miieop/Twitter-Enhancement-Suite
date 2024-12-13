import { extractDataFromResponse } from "~utils/twe_utils";
import { extractTimelineTweet } from "~utils/twe_utils";
import type { Tweet } from "./types/tweet";
import type { Interceptor } from "./types/General";
import type { TimelineInstructions } from "./types";
import { db } from "~database";
import { DevLog } from "~utils/devUtils";



interface BookmarksResponse {
  data: {
    bookmark_timeline_v2: {
      timeline: {
        instructions: TimelineInstructions;
        responseObjects: unknown;
      };
    };
  };
}

// https://twitter.com/i/api/graphql/j5KExFXtSWj8HjRui17ydA/Bookmarks
export const BookmarksInterceptor: Interceptor = (req, res) => {
  if (!/\/graphql\/.+\/Bookmarks/.test(req.url)) {
    return;
  }

  try {
    const newData = extractDataFromResponse<BookmarksResponse, Tweet>(
      res,
      (json) => json.data.bookmark_timeline_v2.timeline.instructions,
      (entry) => extractTimelineTweet(entry.content.itemContent),
    );

    const response = JSON.parse(res.responseText) as BookmarksResponse

    
    // Dispatch a custom event
    for(const record of newData) {
      console.log("Sending intercepted data to IndexDB:", record.rest_id)
      window.dispatchEvent(new CustomEvent('dataInterceptedEvent', { detail: {data:record, type: "bookmarks", originator_id: record.rest_id }}));
    }
    console.log('TTT Bookmarks: ', JSON.stringify(newData, null, 2))
    console.log(`TTT Bookmarks: ${newData.length} items received`);
    // Add captured data to the database.
    //db.extAddTweets(ext.name, newData);
    console.log('TTT Bookmarks: ', JSON.stringify(newData, null, 2))
    console.log(`TTT Bookmarks: ${newData.length} items received`);
    //logger.info(`Bookmarks: ${newData.length} items received`);
  } catch (err) {
    //logger.debug(req.method, req.url, res.status, res.responseText);
    //logger.errorWithBanner('Bookmarks: Failed to parse API response', err as Error);
  }
};