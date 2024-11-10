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
import { GlobalCachedData } from "./Storage/CachedData"
import TweetStorage from "./Storage/TweetsStorage"

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
  css: ["font.css"]
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

const isDev = process.env.environment === "dev"


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

  const [userRelationshipStatus, setUserRelationshipStatus] = useState({
    isMutual: false,
    isFollowed: false,
    isFollower: false
  })
  const [userId, setUserId] = useState("")
  const [value, setValue] = useState(0)
  //tweetStorage.addTweet(tweetData);

  //MarkAsStored(tweetElement)
  if (isDev) {
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
        //console.log("followers",JSON.stringify(followers))
      } catch (error) {
        console.error("Error fetching relationship data:", error)
      }
    }
    if (!userId) {
      getUser().then((i) => {
        setUserId(i.id)
        console.log("userId", i.id)
      })
    }

    if (userId) {
      checkRelationships()
    }
  }, [tweetData.id, tweetElement, userId])
  //console.log(tweetData);
  if (tweetData.engagement.likes > 100000) {
    parentElement.innerHTML = `<div> too many likes </div>`
  }

  if (userRelationshipStatus) {
    if (userRelationshipStatus.isMutual) {
      TweetEnhancements.enhanceMutualTweet(tweetElement)
    } else if (userRelationshipStatus.isFollowed) {
      TweetEnhancements.enhanceFollowingTweet(tweetElement)
    } else if (userRelationshipStatus.isFollower) {
      TweetEnhancements.enhanceFollowerTweet(tweetElement)
    }
  }

  if(openXUsername === tweetData.author.handle) {
    TweetEnhancements.enhanceOriginalPoster(tweetElement)
  }

  //NotEndorsedAnymore(tweetElement)

  tweetStorage.inserted().then((v) => setValue(v))

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
