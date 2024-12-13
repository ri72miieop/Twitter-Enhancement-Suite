import { extractDataFromResponse, extractTimelineUser } from "~utils/twe_utils";
import type { Interceptor } from "./types/General";
import type { TimelineInstructions, User } from "./types";

export interface FollowingResponse {
  data: {
    user: {
      result: {
        timeline: {
          timeline: {
            instructions: TimelineInstructions;
          };
        };
        __typename: 'User';
      };
    };
  };
}

// https://twitter.com/i/api/graphql/iSicc7LrzWGBgDPL0tM_TQ/Following
export const FollowingInterceptor: Interceptor = (req, res) => {
  if (!/\/graphql\/.+\/Following/.test(req.url)) {
    return;
  }

  try {
    const newData = extractDataFromResponse<FollowingResponse, User>(
      res,
      (json) => json.data.user.result.timeline.timeline.instructions,
      (entry) => extractTimelineUser(entry.content.itemContent),
    );

    // Add captured data to the database.
    //db.extAddUsers(ext.name, newData);

    // Dispatch a custom event
    for(const user of newData) {
      console.log("Sending intercepted data to IndexDB:", user.rest_id)
      window.dispatchEvent(new CustomEvent('dataInterceptedEvent', { detail: {data:user, type: "following", originator_id: user.rest_id }}));
    }
    console.log('TTT Following: ', JSON.stringify(newData, null, 2))
    console.log(`TTT Following: ${newData.length} items received`);
  } catch (err) {
    console.log('TTT Following: Failed to parse API response', err)
    //logger.debug(req.method, req.url, res.status, res.responseText);
    //logger.errorWithBanner('Following: Failed to parse API response', err as Error);
  }
};