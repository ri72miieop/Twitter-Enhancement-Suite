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
      insertPosition: "afterend"
    }
  })
}

// Custom mount function to position our component side by side with tweets
//export const mountShadowHost: PlasmoMountShadowHost = ({
//  shadowHost,
//  anchor,
//  mountState
//}) => {
//  const article = anchor.element
//  const tweetId = article.getAttribute("aria-labelledby") || "unknown-tweet"
//  
//  // Add ID to the shadowHost for easy identification in DevTools
//  const hostElement = shadowHost as HTMLElement
//  hostElement.id = `tweet-sidepanel-${tweetId}`
//  
//  // Position it absolutely within Twitter's layout
//  // This is a more conservative approach that doesn't restructure the DOM
//  hostElement.setAttribute('style', `
//    position: fixed;
//    right: -250px;
//    height: 250px;
//    width: 100px;
//    background-color: white;
//    padding: 10px;
//    border-radius: 8px;
//    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
//    z-index: 9999;
//    overflow-y: auto;
//    border: 1px solid #eee;
//  `)
//  
//  // Use the default insertion position (afterend)
//  article.insertAdjacentElement('afterend', shadowHost)
//  
//  // Add a CSS class for easy selection in DevTools
//  hostElement.classList.add('plasmo-tweet-sidepanel')
//  
// // // Position the panel next to the article vertically when it's in view
// // const updatePanelPosition = () => {
// //   const rect = article.getBoundingClientRect()
// //   if (rect.top < window.innerHeight && rect.bottom > 0) {
// //     hostElement.style.top = `${rect.top}px`
// //     hostElement.style.display = 'block'
// //   } else {
// //     hostElement.style.display = 'none'
// //   }
// // }
// // 
// // // Update position initially and on scroll
// // updatePanelPosition()
// // window.addEventListener('scroll', updatePanelPosition)
//  
//  // Clean up event listener when extension is unloaded
//  mountState.observer.observe(shadowHost, { childList: true, subtree: true })
//}

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
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

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
      if(!tweetData.id) return;
      await new Promise(resolve => setTimeout(resolve, 3000))
      const response = await sendToBackground({
        name: "get-intercepted-tweet",
        body: {
          originator_id: tweetData.id
        }
      })
      
      if(isDev){
      const insertedDate = response.timestamp;
      const processedDate = response.date_added;
      if (!insertedDate && !processedDate) {
        const { error } = await supabase.from("no_show").upsert({tweet_id: tweetData.id})
              if (error) {
                DevLog("Error inserting no_show:" + error, "error")
              }
          }
        }
      setInterceptedTweet(response)
    }

    loadInterceptedTweet()
  }, [tweetData])

  // Apply enhancements based on preferences
  useEffect(() => {
    if (!preferences || !tweetElement) return

    // Viral tweets blur
    if (preferences.blurViralTweets && tweetData.engagement.likes > 100000) {
      TweetEnhancements.enhanceHighEngagementTweet(tweetElement)
    }
    ///else {
    ///  TweetEnhancements.removeHighEngagementTweet(tweetElement)
    ///}

    // Relationship badges
    if (preferences.showRelationshipBadges && userRelationshipStatus) {
      if (userRelationshipStatus.isMutual) {
        TweetEnhancements.enhanceMutualTweet(tweetElement)
      } else if (userRelationshipStatus.isFollowed) {
        TweetEnhancements.enhanceFollowingTweet(tweetElement)
      } else if (userRelationshipStatus.isFollower) {
        TweetEnhancements.enhanceFollowerTweet(tweetElement)
      }
    } 
    ///else {
    ///  TweetEnhancements.removeMutualTweetEnhancements(tweetElement)
    ///  TweetEnhancements.removeFollowingTweetEnhancements(tweetElement)
    ///  TweetEnhancements.removeFollowerTweetEnhancements(tweetElement)
    ///}

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
    }
    // else {
    //  TweetEnhancements.removeSignalBoostingUrls(tweetElement)
    //}

    // User obfuscation
    if (userId && preferences.obfuscateAllUsers) {
      TweetEnhancements.obfuscateUser(tweetElement)
    } 
    // else {
    //  TweetEnhancements.removeObfuscation(tweetElement)
    //}

    // Original poster badge
    if (preferences.showOriginalPosterBadge && openXUsername === tweetData.author.handle) {
      TweetEnhancements.enhanceOriginalPoster(tweetElement)
    } 
    ///else {
    ///  TweetEnhancements.removeOriginalPosterEnhancements(tweetElement)
    ///}

    // Long tweet text enhancement
    if (preferences.enhanceLongTweetText && 
        interceptedTweet?.tweet?.full_text && 
        interceptedTweet.tweet.full_text.length > 280 && 
        isSpecificTweetPage) {
      TweetEnhancements.enhanceTweetWithLongTweetText(tweetElement, interceptedTweet.tweet.full_text)
    } 
    ///else {
    ///  TweetEnhancements.removeLongTweetText(tweetElement)
    ///}
  }, [preferences, tweetElement, userRelationshipStatus, interceptedTweet, userId])

  //TweetEnhancements.applyTextModifiers(tweetElement)

  //NotEndorsedAnymore(tweetElement)


  const handleSearch = async () => {
    try {
      const response = await fetch('https://twowtter.com:8888/search/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collection: "tweets",
          "top-k": 2,
          text: interceptedTweet?.tweet?.full_text ?? tweetData.content
        })
      });
      const data = await response.json();
      console.log(data.matches)
      setSearchResults(data.matches);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching tweets:', error);
    }
  };

  return (<>
  {(preferences?.findSimilarTweets) && (
      <div
        style={{
          position: 'relative',
          opacity: 0,
          transition: 'opacity 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
      >
        <button
          onClick={handleSearch}
          style={{
            backgroundColor: '#1DA1F2',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
          Search Similar Tweets
        </button>
        {showResults && (
          <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f7f7f7', borderRadius: '10px'}}>
            {searchResults.map((result, index) => (
              <div key={index} style={{marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '8px'}}>
                {result.metadata.username}: {result.metadata.full_text}
                <br />
                <a href={`https://x.com/${result.metadata.username}/status/${result.metadata.tweet_id}`} target="_blank" rel="noopener noreferrer">{result.metadata.tweet_id}</a>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
    {preferences?.markTweetWithScrapeStatus && interceptedTweet &&(
      <div style={{ width: '100%' }}>
        <p style={{ textAlign: 'right', paddingRight: '16px' }}>
          {interceptedTweet.canSendToCA && interceptedTweet.timestamp !== null ? (
            <span style={{ color: 'green', fontWeight: 'bold' }}>✓</span>
          ) : (
            <span style={{ color: 'red', fontWeight: 'bold' }}>✗ - {interceptedTweet.reason} - {interceptedTweet.timestamp} - {interceptedTweet.date_added}</span>
          )}
        </p>
      </div>
    )}
    </>
  );
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