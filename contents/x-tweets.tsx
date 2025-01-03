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
import TweetStorage from "./Storage/TweetsStorage"
import { DevLog, isDev } from "~utils/devUtils"
import { sendToBackground } from "@plasmohq/messaging"
import type { InsertTweets } from "~types/database-explicit-types"; 

export const getShadowHostId: PlasmoGetShadowHostId = ({ element }) =>
  element.getAttribute("aria-labelledby") + `-xtweets`

//import "~/prod.css"

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  //disable it for now
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
  // Check if URL matches pattern x.com/username/status/
  const match = url.match(/x\.com\/([^\/]+)\/status\//);
  
  // Return username if found, false otherwise
  return match ? match[1] : false;
};

const tweetStorage = new TweetStorage()
const XTweet = ({ anchor }: PlasmoCSUIProps) => {
  const parentElement = anchor.element.parentElement
  const tweetElement = parentElement.querySelector("article")
  const tweetData = scrapeTweet(tweetElement)
  const openXUsername = extractXUsername(window.location.href)

  //DevLog("XTweet " + tweetData.id + " " + tweetData.author.handle)

  const [userRelationshipStatus, setUserRelationshipStatus] = useState({
    isMutual: false,
    isFollowed: false,
    isFollower: false
  })
  const [preferences, setPreferences] = useState<TweetEnhancementPreferences>()
  const [userId, setUserId] = useState("")
  const [interceptedTweet, setInterceptedTweet] = useState<InsertTweets | null>(null)

  //tweetStorage.addTweet(tweetData);


  useEffect(() => {
    // Load saved preferences on mount
    GlobalCachedData.GetEnhancementPreferences().then(savedPrefs => {
      if (savedPrefs) {
        setPreferences(savedPrefs)
      }
    })
  }, [])

  //MarkAsStored(tweetElement)
  if (isDev  && false) {
    useEffect(() => {
      if (!isDev) return

      const interval = setInterval(() => {
        tweetStorage.GetStatus(tweetData.id).then((status) => {
          if (status === "INSERTED") {
            ChangeBackgroundColor(tweetElement, "green")
          } else if (status === "SAVED") {
            ChangeBackgroundColor(tweetElement, "yellow")
          } else if (status === "NOT_SAVED") {
            ChangeBackgroundColor(tweetElement, "red")
          }
        })
      }, 1000)

      // Cleanup interval on component unmount
      return () => clearInterval(interval)
    }, [tweetData.id, tweetElement])
  }

  useEffect(() => {
    

    new Promise(resolve => setTimeout(resolve, 2000))
    .then(async () => {
    const response = await sendToBackground({
      name: "get-intercepted-tweet",
      body: {
        originator_id: tweetData.id
      }
    })

    console.log("GOT RESPONSE",JSON.stringify(response), "for tweet", tweetData.id)
    setInterceptedTweet(response.tweet)
    })
  },[])

  if(preferences && preferences.enhanceLongTweetText && interceptedTweet && interceptedTweet.full_text && interceptedTweet.full_text.length > 280){ // && interceptedTweet.full_text.length < 2000) {
    DevLog("Enhancing tweet id", interceptedTweet.tweet_id, "with text", interceptedTweet.full_text)
    TweetEnhancements.enhanceTweetWihtLongTweetText(tweetElement, interceptedTweet.full_text)
  }


  useEffect(() => {
    async function checkRelationships() {
      if (!userId) return

      try {
        const [moots, follows, followers] = await Promise.all([
          GlobalCachedData.GetMoots(userId),
          GlobalCachedData.GetFollows(userId),
          GlobalCachedData.GetFollowers(userId)
        ])
        setUserRelationshipStatus({
          isMutual: moots.some(
            (moot) => moot.username === tweetData.author.handle
          ),
          isFollowed: follows.some(
            (follow) => follow.username === tweetData.author.handle
          ),
          isFollower: followers.some(
            (follower) => follower.username === tweetData.author.handle
          )
        })
        //DevLog("followers",JSON.stringify(followers))
      } catch (error) {
        DevLog("Error fetching relationship data:" + error, "error")
      }
    }
    if (!userId) {
      getUser().then((i) => {
        if(i) {
          setUserId(i.id)
          //DevLog("userId " + i.id, "debug")
        }
      })
    }

    if (userId && preferences && preferences.showRelationshipBadges) {
      checkRelationships()
    }
  }, [tweetData.id, tweetElement, userId])
  //DevLog(tweetData);
  if (preferences && preferences.blurViralTweets && tweetData.engagement.likes > 100000) {
    TweetEnhancements.enhanceHighEngagementTweet(tweetElement)
  }

  if (preferences && preferences.showRelationshipBadges &&  userRelationshipStatus ) {
    if (userRelationshipStatus.isMutual) {
      TweetEnhancements.enhanceMutualTweet(tweetElement)
    } else if (userRelationshipStatus.isFollowed) {
      TweetEnhancements.enhanceFollowingTweet(tweetElement)
    } else if (userRelationshipStatus.isFollower) {
      TweetEnhancements.enhanceFollowerTweet(tweetElement)
    }
  }

  if(preferences && preferences.enableSignalBoostingUrls) {
    TweetEnhancements.enhanceSignalBoostingUrls(tweetElement, async ()=> {
      const user = await getUser();
      DevLog("signal boosting", tweetData.id, user.id)
      await supabase.from("signal_boosts").upsert({
        tweet_id: tweetData.id,
        boosted_by: user.id
      });

    })
  }



  //DevLog(`preferences x-tweets ${JSON.stringify(preferences)}`)
  if(userId && preferences && preferences.obfuscateAllUsers) {
    TweetEnhancements.obfuscateUser(tweetElement)
  }

  if(preferences && preferences.showOriginalPosterBadge && openXUsername === tweetData.author.handle) {
    TweetEnhancements.enhanceOriginalPoster(tweetElement)
  }

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
