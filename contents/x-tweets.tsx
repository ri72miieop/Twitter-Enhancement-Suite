import type { PlasmoCSUIProps, PlasmoGetInlineAnchorList, PlasmoMountShadowHost } from "plasmo"
import cssText from "data-text:~/contents/X-overlay.css"
import type { PlasmoCSConfig } from "plasmo"

import type { PlasmoGetShadowHostId } from "plasmo"
import { scrapeTweet } from "./scrapeTweet"

 
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



const XTweet = ({ anchor }: PlasmoCSUIProps) => {
    const parentElement = anchor.element.parentElement
    const tweetElement = parentElement.querySelector("article");
    const tweetData = scrapeTweet(tweetElement);
    console.log(tweetData);

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