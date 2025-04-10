import type { Interceptor } from "./types/General";
import type { Tweet } from "./types/tweet";
import type { TimelineInstructions } from "./types";
import { extractTimelineTweet } from "~utils/twe_utils";
import { extractDataFromResponse } from "~utils/twe_utils";
import { db } from "~database";
import { DevLog } from "~utils/devUtils";

export interface UntrustedDMsResponse {
  inbox_timeline: {
    status: string;
    min_entry_id: string;
    entries: Array<{
      message: {
        id: string;
        time: string;
        affects_sort: boolean;
        request_id?: string;
        conversation_id: string;
        message_data: {
          id: string;
          time: string;
          recipient_id: string;
          sender_id: string;
          text: string;
          edit_count: number;
          entities?: {
            hashtags: any[];
            symbols: any[];
            user_mentions: Array<{
              screen_name: string;
              name: string;
              id: number;
              id_str: string;
              indices: number[];
            }>;
            urls: Array<{
              url: string;
              expanded_url: string;
              display_url: string;
              indices: number[];
            }>;
          };
          attachment?: {
            card?: {
              name: string;
              url: string;
              card_type_url: string;
              binding_values: {
                [key: string]: {
                  type: string;
                  string_value?: string;
                  scribe_key?: string;
                  user_value?: {
                    id_str: string;
                    path: any[];
                  };
                  image_value?: {
                    url: string;
                    width: number;
                    height: number;
                    alt: null;
                  };
                  image_color_value?: {
                    palette: Array<{
                      percentage: number;
                      rgb: {
                        red: number;
                        green: number;
                        blue: number;
                      };
                    }>;
                  };
                };
              };
            };
          };
        };
      };
    }>;
    users: {
      [key: string]: {
        id: number;
        id_str: string;
        name: string;
        screen_name: string;
        location: string | null;
        description: string;
        url: string | null;
        entities: {
          url?: {
            urls: Array<{
              url: string;
              expanded_url: string;
              display_url: string;
              indices: number[];
            }>;
          };
          description: {
            urls: Array<{
              url: string;
              expanded_url: string;
              display_url: string;
              indices: number[];
            }>;
          };
        };
        protected: boolean;
        followers_count: number;
        friends_count: number;
        listed_count: number;
        created_at: string;
        favourites_count: number;
        utc_offset: null;
        time_zone: null;
        geo_enabled: boolean;
        verified: boolean;
        statuses_count: number;
        lang: null;
        contributors_enabled: boolean;
        is_translator: boolean;
        is_translation_enabled: boolean;
        profile_background_color: string;
        profile_background_image_url: string | null;
        profile_background_image_url_https: string | null;
        profile_background_tile: boolean;
        profile_image_url: string;
        profile_image_url_https: string;
        profile_banner_url?: string;
        profile_link_color: string;
        profile_sidebar_border_color: string;
        profile_sidebar_fill_color: string;
        profile_text_color: string;
        profile_use_background_image: boolean;
        default_profile: boolean;
        default_profile_image: boolean;
        can_dm: null;
        can_secret_dm?: null;
        can_media_tag: boolean;
        following: boolean;
        follow_request_sent: boolean;
        notifications: boolean;
        blocking: boolean;
        subscribed_by: boolean;
        blocked_by: boolean;
        want_retweets: boolean;
        dm_blocked_by: boolean;
        dm_blocking: boolean;
        business_profile_state: string;
        translator_type: string;
        withheld_in_countries: any[];
        followed_by: boolean;
      };
    };
    conversations: {
      [key: string]: {
        conversation_id: string;
        type: string;
        sort_event_id: string;
        sort_timestamp: string;
        participants: Array<{
          user_id: string;
          last_read_event_id: string;
        }>;
        nsfw: boolean;
        notifications_disabled: boolean;
        mention_notifications_disabled: boolean;
        last_read_event_id: string;
        read_only: boolean;
        trusted: boolean;
        low_quality: boolean;
        social_proof: Array<{
          proof_type: string;
          users: string[];
          total: number;
        }>;
        muted: boolean;
        status: string;
        min_entry_id: string;
        max_entry_id: string;
      };
    };
  };
}
  
  // https://twitter.com/i/api/graphql/lVf2NuhLoYVrpN4nO7uw0Q/Likes
  export const UntrustedDMsInterceptor: Interceptor =  (req, res) => {
    return;
    if (!/\/dm\/inbox_timeline\/untrusted/.test(req.url)) {
      return;
    }

    try {
      const newData = extractDataFromResponse<UntrustedDMsResponse, Tweet>(
        res,
        (json) => json.data.user.result.timeline_v2.timeline.instructions,
        (entry) => extractTimelineTweet(entry.content.itemContent),
      );
  

      // Dispatch a custom event
    for(const tweet of newData) {
      DevLog("Sending intercepted data to IndexDB:", tweet.rest_id)
      window.dispatchEvent(new CustomEvent('dataInterceptedEvent', { detail: {data:tweet, type: "likes", originator_id: tweet.rest_id, item_id: tweet.rest_id }}));
    }
      DevLog('TTT Likes: ', JSON.stringify(newData, null, 2))
      

      // Add captured data to the database.
      //db.extAddTweets("likes", newData);
      //DevLog("Likes added from interceptor");
      
      DevLog(`TTT Likes: ${newData.length} items received`);
    } catch (err) {
      DevLog("LikesInterceptor failed", err)
      //logger.debug(req.method, req.url, res.status, res.responseText);
      //logger.errorWithBanner('Likes: Failed to parse API response', err as Error);
    }
  };