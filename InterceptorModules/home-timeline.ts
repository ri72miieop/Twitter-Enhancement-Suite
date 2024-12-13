import { extractDataFromResponse, extractTimelineTweet } from "~utils/twe_utils";
import type { Interceptor } from "./types/General";
import type { TimelineInstructions, Tweet } from "./types";
import { z } from "zod"; // Type validation
import * as Database from "~types/database-explicit-types"; // Your database types
import { supabase } from "~core/supabase";
import { indexDB } from "~utils/IndexDB";
import { DevLog, PLASMO_PUBLIC_CRX_ID } from "~utils/devUtils";
import { relayMessage, sendToBackground, sendToBackgroundViaRelay } from "@plasmohq/messaging";
import CachedData, { GlobalCachedData } from "~contents/Storage/CachedData";




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
    console.log("Interceptor.function - HomeTimelineInterceptor: ", newData.length)
    // Add captured data to the database.
    //db.extAddTweets(ext.name, newData);
   //const tweets =[];
   //for(const tweet of newData) {
   //  tweets.push(TwitterDataMapper.mapTweet(tweet, null));

   //  //sendToBackground({
   //  //  name: "send-intercepted-data",
   //  //  body: { tweet }
   //  //});
   //  //if(!window) console.log("Can't find window")
   //  //if(!window["__interceptedData"]) {console.log("Can't find interceptedData"); window["__interceptedData"] = []}
   //  //window["__interceptedData"].push(tweet);

   //  //console.log("Sending tweet to background via relay:", tweet)
   //  //relayMessage({
   //  //  name: "send-intercepted-data",
   //  //  body: tweet
   //  //})
   //  //relayMessage({
   //  //  name: "send-feedback",
   //  //  body: {
   //  //    user: {
   //  //      username: "test"
   //  //    },
   //  //    feedback: "intercepted"
   //  //  }
   //  //})


   //  
   //  console.log("Added tweet to IndexDB:" + tweet.rest_id)
   //}
    
    // Dispatch a custom event
    for(const tweet of newData) {
      console.log("Sending intercepted data to IndexDB:", tweet.rest_id)
      window.dispatchEvent(new CustomEvent('dataInterceptedEvent', { detail: {data:tweet, type: "home-timeline", originator_id: tweet.rest_id, item_id: tweet.rest_id }}));
    }
    console.log('TTT HomeTimeline: ', JSON.stringify(newData, null, 2))
    console.log(`TTT HomeTimeline: ${newData.length} items received`);
  } catch (err) {
    console.log('TTT HomeTimeline: Failed to parse API response', err)
    //logger.debug(req.method, req.url, res.status, res.responseText);
    //logger.errorWithBanner('HomeTimeline: Failed to parse API response', err as Error);
  }
};



/*
// Types for the incoming Twitter data structure
type TwitterGraphQLResponse = {
  __typename: string;
  rest_id: string;
  core: {
    user_results: {
      result: {
        legacy: {
          screen_name: string;
          name: string;
          profile_image_url_https: string;
          created_at: string;
          description: string;
          followers_count: number;
          following_count?: number;
          friends_count: number;
          favourites_count: number;
          statuses_count: number;
        };
      };
    };
  };
  card?: {
    legacy: {
      binding_values: Array<{
        key: string;
        value: {
          string_value?: string;
          type: string;
        };
      }>;
    };
  };
  legacy: {
    created_at: string;
    full_text: string;
    favorite_count: number;
    reply_count: number;
    retweet_count: number;
    quote_count: number;
    conversation_id_str: string;
    entities: {
      urls?: Array<{
        expanded_url: string;
        display_url: string;
        url: string;
      }>;
      user_mentions?: Array<{
        screen_name: string;
        name: string;
        id_str: string;
      }>;
      media?: Array<{
        type: string;
        media_url_https: string;
        expanded_url: string;
      }>;
    };
  };
};*/

export class TwitterDataMapper2 {
  /**
   * Maps an account from Twitter data to database schema
   */


static mapAll(tweetData: Tweet): {account: Database.InsertAccount, profile: Database.InsertProfile, tweet: Database.InsertTweets} {

  const tweet = this.mapTweet(tweetData, null)
  tweetData.legacy.is_quote_status



  return {
    account: this.mapAccount(tweetData),
    profile: this.mapProfile(tweetData),
    tweet: this.mapTweet(tweetData, 0)
  }
}

  static mapAccount(tweetData: Tweet): Database.InsertAccount {
    const userData = tweetData.core.user_results.result;

    return {
      account_id: userData.rest_id,
      created_via: "twitter_import",
      username: userData.legacy.screen_name,
      created_at: userData.legacy.created_at,
      account_display_name: userData.legacy.name,
      num_tweets: userData.legacy.statuses_count,
      num_following: userData.legacy.friends_count,
      num_followers: userData.legacy.followers_count,
      num_likes: userData.legacy.favourites_count
    };
  }

  static mapProfile(tweetData: Tweet): Database.InsertProfile {
    const userData = tweetData.core.user_results.result;

    return {
      account_id: userData.rest_id,
      avatar_media_url: userData.legacy.profile_image_url_https,
      bio: userData.legacy.description,
      location: userData.legacy.location,
      website: userData.legacy.url,
      header_media_url: userData.legacy.profile_banner_url,
    };
  }

  /**
   * Maps a tweet from Twitter data to database schema
   */
  static mapTweet(tweet: Tweet, archiveUploadId: number): Database.InsertTweets {
    const hasQT = tweet.legacy.is_quote_status;

    //const QuotedObject = hasQT ? this.mapTweet(tweet.quotedRefResult.result, archiveUploadId) : null;


        return {
          tweet_id: tweet.rest_id,
          account_id: tweet.legacy.user_id_str,
          created_at: new Date(tweet.legacy.created_at).toISOString(),
          full_text: tweet.legacy.full_text,
          retweet_count: tweet.legacy.retweet_count,
          favorite_count: tweet.legacy.favorite_count,
          reply_to_tweet_id: tweet.legacy.in_reply_to_status_id_str || null,
          reply_to_user_id: tweet.legacy.in_reply_to_user_id_str || null,
          reply_to_username: tweet.legacy.in_reply_to_screen_name || null,
          archive_upload_id: archiveUploadId
        };
      }

      static mapUser(tweet: Tweet, archiveUploadId: number): {account: Database.InsertAccount, profile: Database.InsertProfile} {
        return {
          account: this.mapAccount(tweet),
          profile: this.mapProfile(tweet)
        };
      }

  /**
   * Maps mentioned users from a tweet
   */
  static mapMentionedUsers(tweetData: Tweet): Database.InsertMentionedUsers[] {
    const mentions = tweetData.legacy.entities.user_mentions || [];
    
    return mentions.map(mention => ({
      user_id: mention.id_str,
      name: mention.name,
      screen_name: mention.screen_name,
      updated_at: new Date().toISOString()
    }));
  }

  /**
   * Maps user mentions linking table
   */
  static mapUserMentions(tweetData: Tweet): Database.InsertUserMentions[] {
    const mentions = tweetData.legacy.entities.user_mentions || [];
    
    return mentions.map(mention => ({
      mentioned_user_id: mention.id_str,
      tweet_id: tweetData.rest_id
    }));
  }

  /**
   * Maps tweet URLs
   */
  static mapTweetUrls(tweetData: Tweet): Database.InsertTweetURLs[] {
    const urls = tweetData.legacy.entities.urls || [];
    
    return urls.map(url => ({
      url: url.url,
      expanded_url: url.expanded_url,
      display_url: url.display_url,
      tweet_id: tweetData.rest_id
    }));
  }

  /**
   * Maps tweet media
   */
  static mapTweetMedia(tweetData: Tweet, archiveUploadId: number): Database.InsertTweetMedia[] {
    const media = tweetData.legacy.entities.media || [];
    
    return media.map((mediaItem, index) => ({
      media_id: parseInt(tweetData.rest_id + index.toString()),
      tweet_id: tweetData.rest_id,
      media_url: mediaItem.media_url_https,
      media_type: mediaItem.type,
      width: 0, // Need to extract from media metadata if available
      height: 0, // Need to extract from media metadata if available
      archive_upload_id: archiveUploadId
    }));
  }

  /**
   * Main method to process a batch of tweets
   */
//  static async processTweetBatch(
//    tweets: TwitterGraphQLResponse[],
//    archiveUploadId: number
//  ): Promise<{
//    accounts: Database.InsertAccount[];
//    tweets: Database.InsertTweets[];
//    mentionedUsers: Database.InsertMentionedUsers[];
//    userMentions: Database.InsertUserMentions[];
//    tweetUrls: Database.InsertTweetURLs[];
//    tweetMedia: Database.InsertTweetMedia[];
//  }> {
//    const accounts: Database.InsertAccount[] = [];
//    const mappedTweets: Database.InsertTweets[] = [];
//    const mentionedUsers: Database.InsertMentionedUsers[] = [];
//    const userMentions: Database.InsertUserMentions[] = [];
//    const tweetUrls: Database.InsertTweetURLs[] = [];
//    const tweetMedia: Database.InsertTweetMedia[] = [];
//
//    for (const tweet of tweets) {
//      accounts.push(this.mapAccount(tweet));
//      mappedTweets.push(this.mapTweet(tweet as Tweet, archiveUploadId));
//      mentionedUsers.push(...this.mapMentionedUsers(tweet));
//      userMentions.push(...this.mapUserMentions(tweet));
//      tweetUrls.push(...this.mapTweetUrls(tweet));
//      tweetMedia.push(...this.mapTweetMedia(tweet, archiveUploadId));
//    }
//
//    for(const account of accounts) {
//       await supabase.from('account').insert(account);
//    }
//    for(const tweet of mappedTweets) {
//      await supabase.from('tweets').insert(tweet);
//    }
//
//
//    return {
//      accounts,
//      tweets: mappedTweets,
//      mentionedUsers,
//      userMentions,
//      tweetUrls,
//      tweetMedia
//    };
//  }
}