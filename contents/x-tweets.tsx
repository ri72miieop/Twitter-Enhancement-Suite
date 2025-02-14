import cssText from "data-text:~/contents/X-overlay.css"
import type {
  PlasmoCSConfig,
  PlasmoCSUIProps,
  PlasmoGetInlineAnchorList,
  PlasmoGetShadowHostId,
  PlasmoMountShadowHost
} from "plasmo"
import { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { supabase } from "~core/supabase"
import { getUser } from "~utils/dbUtils"
import { TweetEnhancements } from "~utils/TweetEnhancements"

import { scrapeTweet } from "./scrapeTweet"
import { GlobalCachedData, type TweetEnhancementPreferences } from "./Storage/CachedData"

import { DevLog, isDev } from "~utils/devUtils"
import { sendToBackground } from "@plasmohq/messaging"
import type { InsertTweets } from "~types/database-explicit-types"; 

export const getShadowHostId: PlasmoGetShadowHostId = ({ element }) =>
  element.getAttribute("aria-labelledby") + `-xtweets`

//import "~/prod.css"
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const anchors = document.querySelectorAll("article")
  return Array.from(anchors).map((element) => {
    return {
      element,
      insertPosition: "beforebegin"
    }
  })
}

export const config: PlasmoCSConfig = {
  matches: ["https://*.x.com/*"],
  all_frames: true
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const NotEndorsedAnymore = (element: HTMLElement) => {
  element.style["textDecoration"] = "line-through"
}

const MarkAsStored = (element: HTMLElement) => {
  element.style["background-color"] = "yellow"
}

const ChangeBackgroundColor = (element: HTMLElement, color: string) => {
  element.style["background-color"] = color
}

const extractXUsername = (url: string): string | false => {
  const match = url.match(/x\.com\/([^\/]+)\/status\//);
  return match ? match[1] : false;
};


const XTweet = ({ anchor }: PlasmoCSUIProps) => {
  const parentElement = anchor.element.parentElement
  const tweetElement = parentElement.querySelector("article")
  const tweetData = scrapeTweet(tweetElement)
  const currentUrl = window.location.href

  const isSpecificTweetPage = currentUrl.includes("/status/");
  const openXUsername = extractXUsername(currentUrl)

  const [userRelationshipStatus, setUserRelationshipStatus] = useState({
    isMutual: false,
    isFollowed: false,
    isFollower: false
  })
  //const [preferences, setPreferences] = useState<TweetEnhancementPreferences>()
  const [userId, setUserId] = useState("")
  const [interceptedTweet, setInterceptedTweet] = useState<any>(null)
  const [preferences] = useStorage("tweetEnhancementPreferences")

  //MarkAsStored(tweetElement)
  if (isDev  && false) {
    useEffect(() => {
      

      const interval = setInterval(() => {
        return;
        if(!preferences.enhanceLongTweetText) return;
        const insertedDate = interceptedTweet.timestamp;
        const processedDate = interceptedTweet.date_added;
        const reason = interceptedTweet.reason;
        const canSendToCA = interceptedTweet.canSendToCA;

        

          //inserted
          if ( insertedDate &&processedDate) {
            ChangeBackgroundColor(tweetElement, "green")
          } 
          //saved on local db
          else if (!insertedDate && processedDate) {
            ChangeBackgroundColor(tweetElement, "yellow")
          }
          else if (!insertedDate && !processedDate) {
            ChangeBackgroundColor(tweetElement, "red")
          }
        
      }, 2000)

      // Cleanup interval on component unmount
      return () => clearInterval(interval)
    }, [preferences, interceptedTweet])
  }
 

  // Load user and check relationships
  useEffect(() => {
    const loadUserAndRelationships = async () => {
      const user = await getUser()
      if (user) {
        setUserId(user.id)
      }
    }

    loadUserAndRelationships()
  }, [])

  // Check relationships when userId or preferences change
  useEffect(() => {
    const checkRelationships = async () => {
      if (!userId || !preferences?.showRelationshipBadges || !interceptedTweet) return

      try {
        const [moots, follows, followers] = await Promise.all([
          GlobalCachedData.GetMoots(userId),
          GlobalCachedData.GetFollows(userId),
          GlobalCachedData.GetFollowers(userId)
        ])

        setUserRelationshipStatus({
          isMutual: moots.some(moot => moot.username === tweetData.author.handle),
          isFollowed: follows.some(follow => follow.username === tweetData.author.handle),
          isFollower: followers.some(follower => follower.username === tweetData.author.handle)
        })
      } catch (error) {
        DevLog("Error fetching relationship data:" + error, "error")
      }
    }

    checkRelationships()
  }, [userId, preferences?.showRelationshipBadges, interceptedTweet])

  // Load intercepted tweet
  useEffect(() => {
    const loadInterceptedTweet = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const response = await sendToBackground({
        name: "get-intercepted-tweet",
        body: {
          originator_id: tweetData.id
        }
      })
      setInterceptedTweet(response)
    }

    loadInterceptedTweet()
  }, [tweetData.id])

  // Apply enhancements based on preferences
  useEffect(() => {
    if (!preferences || !tweetElement) return

    // Viral tweets blur
    if (preferences.blurViralTweets && tweetData.engagement.likes > 100000) {
      TweetEnhancements.enhanceHighEngagementTweet(tweetElement)
    } else {
      TweetEnhancements.removeHighEngagementTweet(tweetElement)
    }

    // Relationship badges
    if (preferences.showRelationshipBadges && userRelationshipStatus) {
      if (userRelationshipStatus.isMutual) {
        TweetEnhancements.enhanceMutualTweet(tweetElement)
      } else if (userRelationshipStatus.isFollowed) {
        TweetEnhancements.enhanceFollowingTweet(tweetElement)
      } else if (userRelationshipStatus.isFollower) {
        TweetEnhancements.enhanceFollowerTweet(tweetElement)
      }
    } else {
      TweetEnhancements.removeMutualTweetEnhancements(tweetElement)
      TweetEnhancements.removeFollowingTweetEnhancements(tweetElement)
      TweetEnhancements.removeFollowerTweetEnhancements(tweetElement)
    }

    // Signal boosting URLs
    if (preferences.enableSignalBoostingUrls) {
      TweetEnhancements.enhanceSignalBoostingUrls(tweetElement, async () => {
        const user = await getUser()
        DevLog("signal boosting", tweetData.id, user.id)
        await supabase.from("signal_boosts").upsert({
          tweet_id: tweetData.id,
          boosted_by: user.id
        })
      })
    } else {
      TweetEnhancements.removeSignalBoostingUrls(tweetElement)
    }

    // User obfuscation
    if (userId && preferences.obfuscateAllUsers) {
      TweetEnhancements.obfuscateUser(tweetElement)
    } else {
      TweetEnhancements.removeObfuscation(tweetElement)
    }

    // Original poster badge
    if (preferences.showOriginalPosterBadge && openXUsername === tweetData.author.handle) {
      TweetEnhancements.enhanceOriginalPoster(tweetElement)
    } else {
      TweetEnhancements.removeOriginalPosterEnhancements(tweetElement)
    }

    // Long tweet text enhancement
    if (preferences.enhanceLongTweetText && 
        interceptedTweet?.tweet?.full_text && 
        interceptedTweet.tweet.full_text.length > 280 && 
        isSpecificTweetPage) {
      TweetEnhancements.enhanceTweetWithLongTweetText(tweetElement, interceptedTweet.tweet.full_text)
    } else {
      TweetEnhancements.removeLongTweetText(tweetElement)
    }
  }, [preferences, tweetElement, userRelationshipStatus, interceptedTweet, userId])

  //TweetEnhancements.applyTextModifiers(tweetElement)

  //NotEndorsedAnymore(tweetElement)
  return(<></>);
  return (
    <>
      {(userRelationshipStatus.isMutual ||
        userRelationshipStatus.isFollowed ||
        userRelationshipStatus.isFollower) && (
        <span
          className="badge"
          style={{
            backgroundColor: "#FF1493",
            color: "white",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "bold",
            marginLeft: "8px"
          }}>
          {" "}
          {userRelationshipStatus.isMutual
            ? "MUTUAL"
            : userRelationshipStatus.isFollowed
              ? "FOLLOWING"
              : userRelationshipStatus.isFollower
                ? "FOLLOWER"
                : ""}{" "}
        </span>
      )}
    </>
  )
  return (
    <span
      className=""
      style={{
        padding: 12
      }}>
      X-Tweet
    </span>
  )
}

export default XTweet