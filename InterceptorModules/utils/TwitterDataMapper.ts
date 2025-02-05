import { extractTweetUnion } from "~utils/twe_utils";
import type { Tweet } from "../types";
import * as Database from "~types/database-explicit-types"; // Your database types


interface TwitterMediaEntity {
    id_str: string
    type: string
    media_url_https: string
    url: string
    display_url: string
    expanded_url: string
    sizes: {
      [key: string]: {
        w: number
        h: number
        resize: string
      }
    }
  }

export class TwitterDataMapper {
    static mapAll(tweetData: Tweet): {
        account: Database.InsertAccount,
        profile: Database.InsertProfile,
        tweet: Database.InsertTweets,
        media?: Database.InsertTweetMedia[],
        urls?: Database.InsertTweetURLs[],
        mentions?: Database.InsertUserMentions[]
      }[] {

        const res = []
        const userData = tweetData.core.user_results.result;
        const legacy = tweetData.legacy;
    
        // Map base tweet
        const tweet = this.mapTweet(tweetData);
        // Map media if present
        const media = this.mapMedia(legacy.extended_entities?.media, tweet.tweet_id);
    
        // Map URLs
        const urls = this.mapUrls(legacy.entities?.urls, tweet.tweet_id);
    
        // Map mentions
        const mentions = this.mapMentions(legacy.entities?.user_mentions, tweet.tweet_id);
    
        res.push({
          account: this.mapAccount(tweetData),
          profile: this.mapProfile(tweetData),
          tweet,
          ...(media?.length && { media }),
          ...(urls?.length && { urls }),
          ...(mentions?.length && { mentions })
        });

        if (legacy.is_quote_status && tweetData.quoted_status_result?.result) {
            let quotedTweetData = extractTweetUnion(tweetData.quoted_status_result.result);
            if(quotedTweetData) {
              const {account: QT_account, profile: QT_profile, tweet: QT_tweet, media: QT_media, urls: QT_urls, mentions: QT_mentions} = this.mapAll(quotedTweetData)[0];
              
              // Create a new object, checking against all existing entries
              const quotedTweetEntry = {
                  // Include account if it's not duplicated in any existing entry
                  ...((!res.some(entry => JSON.stringify(entry.account) === JSON.stringify(QT_account))) && 
                      { account: QT_account }),
                  
                  // Include profile if it's not duplicated in any existing entry
                  ...((!res.some(entry => JSON.stringify(entry.profile) === JSON.stringify(QT_profile))) && 
                      { profile: QT_profile }),
                  
                  // Always include the tweet
                  tweet: QT_tweet,
                  
                  // Include media if it exists and is not duplicated
                  ...(QT_media && !res.some(entry => JSON.stringify(entry.media) === JSON.stringify(QT_media)) && 
                      { media: QT_media }),
                  
                  // Include URLs if they exist and are not duplicated
                  ...(QT_urls && !res.some(entry => JSON.stringify(entry.urls) === JSON.stringify(QT_urls)) && 
                      { urls: QT_urls }),
                  
                  // Include mentions if they exist and are not duplicated
                  ...(QT_mentions && !res.some(entry => JSON.stringify(entry.mentions) === JSON.stringify(QT_mentions)) && 
                      { mentions: QT_mentions })
              };
              res.push(quotedTweetEntry);
              
          }
        }
        return res
      }
    
      private static mapTweet(tweetData: Tweet): Database.InsertTweets {
        const legacy = tweetData.legacy;
        const noteTweet = tweetData.note_tweet;
        const userData = tweetData.core.user_results.result;
    
        return {
          tweet_id: legacy.id_str,
          account_id: userData.rest_id,
          created_at: new Date(legacy.created_at).toISOString(),
          full_text: noteTweet ?noteTweet.note_tweet_results.result.text :  legacy.full_text,
          //lang: legacy.lang,
          favorite_count: legacy.favorite_count,
          
          //reply_count: legacy.reply_count,
          retweet_count: legacy.retweet_count + legacy.quote_count,
          //is_quote_status: legacy.is_quote_status,
          //quoted_status_id: legacy.quoted_status_id_str || null,
          //conversation_id: legacy.conversation_id_str,
          //possibly_sensitive: legacy.possibly_sensitive || false,
          //views_count: Number(tweetData.views?.count) || 0
          reply_to_tweet_id: legacy.in_reply_to_status_id_str || null,
          reply_to_user_id: legacy.in_reply_to_user_id_str || null,
          reply_to_username: legacy.in_reply_to_screen_name || null,
        };
      }
    
      private static mapAccount(tweetData: Tweet): Database.InsertAccount {
        const userData = tweetData.core.user_results.result;
        
        return {
          account_id: userData.rest_id,
          created_via: "twitter_import",
          username: userData.legacy.screen_name,
          created_at: new Date(userData.legacy.created_at).toISOString(),
          account_display_name: userData.legacy.name,
          num_tweets: userData.legacy.statuses_count,
          num_following: userData.legacy.friends_count,
          num_followers: userData.legacy.followers_count,
          num_likes: userData.legacy.favourites_count
        };
      }
    
      private static mapProfile(tweetData: Tweet): Database.InsertProfile {
        const userData = tweetData.core.user_results.result;
    
        return {
          account_id: userData.rest_id,
          avatar_media_url: userData.legacy.profile_image_url_https,
          header_media_url: userData.legacy.profile_banner_url || null,
          bio: userData.legacy.description || null,
          location: userData.legacy.location || null,
          website: userData.legacy.entities?.url?.urls?.[0]?.expanded_url || null,
          //is_verified: userData.is_blue_verified || false,
          //is_private: false // Twitter API v2 doesn't expose this directly
        };
      }
    
      private static mapMedia(media: any[] | undefined, tweetId: string): Database.InsertTweetMedia[] | undefined {
        if (!media?.length) return undefined;
    
        return media.map(m => ({
          tweet_id: tweetId,
          media_id: m.id_str,
          media_type: m.type,
          media_url: m.media_url_https,
          preview_url: m.url,
          //expanded_url: m.expanded_url,
          //alt_text: null, // Add if available in your data
          width: m.original_info.width,
          height: m.original_info.height
        }));
      }
    
      private static mapUrls(urls: any[] | undefined, tweetId: string): Database.InsertTweetURLs[] | undefined {
        if (!urls?.length) return undefined;
    
        return urls.map(u => ({
          tweet_id: tweetId,
          url: u.url,
          expanded_url: u.expanded_url,
          display_url: u.display_url,
          //title: null, // Add if available in your data
          //description: null, // Add if available in your data
          //unwound_url: null // Add if available in your data
        }));
      }
    
      private static mapMentions(mentions: any[] | undefined, tweetId: string): Database.InsertUserMentions[] | undefined {
        if (!mentions?.length) return undefined;
    
        return mentions.map(m => ({
          tweet_id: tweetId,
          mentioned_user_id: m.id_str,
          username: m.screen_name,
          display_name: m.name
        }));
      }
  }