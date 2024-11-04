import type { PlasmoCSUIProps, PlasmoGetInlineAnchorList, PlasmoMountShadowHost } from "plasmo"
import cssText from "data-text:~/contents/X-overlay.css"
import type { PlasmoCSConfig } from "plasmo"

import type { PlasmoGetShadowHostId } from "plasmo"
import { scrapeTweet } from "./scrapeTweet"
import { useStorage } from "@plasmohq/storage/hook"
import TweetStorage from "./Storage/TweetsStorage"
import { useState, useEffect } from "react"
import { GlobalCachedData } from "./Storage/CachedData"
import { supabase } from "~core/supabase"
import { getUser } from "~utils/dbUtils"
import { TweetEnhancements } from "~utils/TweetEnhancements"
 
export const getShadowHostId: PlasmoGetShadowHostId = ({ element }) =>
  element.getAttribute("aria-labelledby") + `-xtweets`



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

const ChangeBackgroundColor = (element: HTMLElement,color:string) => {
    element.style["background-color"] = color
}

const isDev = process.env.environment === "dev"


//const moots = await GlobalCachedData.GetMoots((await getUser().then(i=>i.id)))

const isMutualFollower =  (username:string) => {
  return true;
  //return moots.some(moot => moot.username === username);
};

// Function to enhance tweet visuals for mutual followers
  const enhanceMutualTweet = async (tweetElement) => {
    try {
        // Find the avatar and username elements
        const avatarContainer = tweetElement.querySelector('[data-testid="Tweet-User-Avatar"]');
        const usernameElement = tweetElement.querySelector('div[data-testid="User-Name"] a[role="link"]');
        
        if (!avatarContainer || !usernameElement) return;
        

        

          // 1. Add a dramatic avatar effect
          const avatarInner = avatarContainer.querySelector('div[style*="background-color"]');
          if (avatarInner) {
              // Create a pulsing glow effect
              avatarInner.style.animation = 'pulse 2s infinite';
              avatarInner.style.boxShadow = `
                  0 0 0 3px #ffffff,
                  0 0 0 6px #FF1493,
                  0 0 20px rgba(255, 20, 147, 0.5)
              `;
              avatarInner.style.borderRadius = '50%';
              avatarInner.style.transform = 'scale(1.05)';
          }

          // 2. Add a "Mutual" badge next to the username
          const nameContainer = usernameElement.parentElement;
          if (nameContainer && !nameContainer.querySelector('.mutual-badge')) {
              const mutualBadge = document.createElement('span');
              mutualBadge.className = 'mutual-badge';
              mutualBadge.style.backgroundColor = '#FF1493';
              mutualBadge.style.color = 'white';
              mutualBadge.style.padding = '2px 8px';
              mutualBadge.style.borderRadius = '12px';
              mutualBadge.style.fontSize = '12px';
              mutualBadge.style.fontWeight = 'bold';
              mutualBadge.style.marginLeft = '8px';
              mutualBadge.style.display = 'inline-block';
              mutualBadge.textContent = 'MUTUAL';
              nameContainer.appendChild(mutualBadge);
          }

          // 3. Add a distinctive background to the tweet
          const tweetCard = tweetElement.closest('article');
          if (tweetCard) {
              // Add gradient background
              tweetCard.style.background = 'linear-gradient(45deg, #fff 0%, #ffe6f3 100%)';
              tweetCard.style.borderLeft = '4px solid #FF1493';
              tweetCard.style.transition = 'all 0.3s ease';
              
              // Enhanced hover effect
              tweetCard.addEventListener('mouseenter', () => {
                  tweetCard.style.transform = 'translateX(4px)';
                  tweetCard.style.background = 'linear-gradient(45deg, #fff 0%, #ffd6ec 100%)';
              });
              
              tweetCard.addEventListener('mouseleave', () => {
                  tweetCard.style.transform = 'translateX(0)';
                  tweetCard.style.background = 'linear-gradient(45deg, #fff 0%, #ffe6f3 100%)';
              });
          }

          // 4. Add animation keyframes if they don't exist
          if (!document.querySelector('#mutual-animations')) {
              const styleSheet = document.createElement('style');
              styleSheet.id = 'mutual-animations';
              styleSheet.textContent = `
                  @keyframes pulse {
                      0% { box-shadow: 0 0 0 3px #ffffff, 0 0 0 6px #FF1493, 0 0 20px rgba(255, 20, 147, 0.5); }
                      50% { box-shadow: 0 0 0 3px #ffffff, 0 0 0 8px #FF1493, 0 0 30px rgba(255, 20, 147, 0.7); }
                      100% { box-shadow: 0 0 0 3px #ffffff, 0 0 0 6px #FF1493, 0 0 20px rgba(255, 20, 147, 0.5); }
                  }
              `;
              document.head.appendChild(styleSheet);
            
        }
    } catch (error) {
        console.error('Error enhancing mutual tweet:', error);
    }
};


const tweetStorage = new TweetStorage()
const XTweet = ({ anchor }: PlasmoCSUIProps) => {
    const parentElement = anchor.element.parentElement
    const tweetElement = parentElement.querySelector("article");
    const tweetData = scrapeTweet(tweetElement);
    const [value,setValue] = useState(0)
    //const [tweetsStorage, setTweetsStorage] = useStorage("tweets", (t) => !t || t.length==0?[tweetData]:[...t,tweetData])
    const [isMutual, setIsMutual] = useState(false)
    const [isFollowed, setIsFollowed] = useState(false)
    const [isFollower, setIsFollower] = useState(false)
    const [tweetBadge, setTweetBadge] = useState({isMutual:false,isFollowed:false,isFollower:false})
    const [userId,setUserId] = useState("")
    //tweetStorage.addTweet(tweetData);

    //MarkAsStored(tweetElement)
    if(isDev){
    useEffect(() => {
        if (!isDev) return;

        const interval = setInterval(() => {
            tweetStorage.GetStatus(tweetData.id).then((status) => {
                if (status === "INSERTED") {
                    ChangeBackgroundColor(tweetElement, "green");
                } else if (status === "SAVED") {
                    ChangeBackgroundColor(tweetElement, "yellow");
                } else if (status === "NOT_SAVED") {
                    ChangeBackgroundColor(tweetElement, "red");
                }
            });
        }, 1000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [tweetData.id, tweetElement]);
    }

    useEffect(() => {
      async function checkMutual(){
        const moots = await GlobalCachedData.GetMoots(userId)
        setTweetBadge((item) => ({isMutual:moots.some(moot => moot.username === tweetData.author.handle),isFollowed:item.isFollowed,isFollower:item.isFollower}))
        console.log("isMutual",isMutual)
        //console.log("moots",JSON.stringify(moots))
      }

      async function checkFollows(){
        const follows = await GlobalCachedData.GetFollows(userId)
        setTweetBadge((item) => ({isMutual:item.isMutual,isFollowed:follows.some(follow => follow.username === tweetData.author.handle),isFollower:item.isFollower}))
        console.log("isFollowed",isFollowed)
        //console.log("follows",JSON.stringify(follows))
      }
      async function checkFollowers(){
        const followers = await GlobalCachedData.GetFollowers(userId)
        setTweetBadge((item) => ({isMutual:item.isMutual,isFollowed:item.isFollowed,isFollower:followers.some(follower => follower.username === tweetData.author.handle)}))
        console.log("isFollower",isFollower)
        //console.log("followers",JSON.stringify(followers))
      }
      if(!userId){
        getUser().then(i=>{setUserId(i.id); console.log("userId",userId)})
      }

      if(userId){
        checkMutual()
        checkFollows()
        checkFollowers()
      }
    }, [tweetData.id, tweetElement,userId]);
    //console.log(tweetData);
    if(tweetData.engagement.likes> 100000){
        parentElement.innerHTML = `<div> too many likes </div>`
    }

    if(tweetBadge){
      if(tweetBadge.isMutual){
        TweetEnhancements.enhanceMutualTweet(tweetElement);
      }else if(tweetBadge.isFollowed){
        TweetEnhancements.enhanceFollowingTweet(tweetElement);
      }else if(tweetBadge.isFollower){
        TweetEnhancements.enhanceFollowerTweet(tweetElement);
      }
    }

    //NotEndorsedAnymore(tweetElement)

    tweetStorage.inserted().then(v=>setValue(v));
    
    return (
      <>
      {(tweetBadge.isMutual||tweetBadge.isFollowed||tweetBadge.isFollower) &&(
  <span className="badge" style={{
    backgroundColor : '#FF1493',
                color : 'white',
                padding : '2px 8px',
                borderRadius : '12px',
                fontSize : '12px',
                fontWeight : 'bold',
                marginLeft : '8px'
                }} > {tweetBadge.isMutual?"MUTUAL":tweetBadge.isFollowed?"FOLLOWING":tweetBadge.isFollower?"FOLLOWER":""}</span>
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
