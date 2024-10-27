import type { PlasmoCSUIProps, PlasmoGetInlineAnchorList, PlasmoMountShadowHost } from "plasmo"
import cssText from "data-text:~/contents/X-overlay.css"
import type { PlasmoCSConfig } from "plasmo"

import type { PlasmoGetShadowHostId } from "plasmo"
import { scrapeTweet } from "./scrapeTweet"
import { useStorage } from "@plasmohq/storage/hook"
import TweetStorage from "./Storage/TweetsStorage"
import { useState } from "react"
 
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



const tweetStorage = new TweetStorage()
const XTweet = ({ anchor }: PlasmoCSUIProps) => {
    const parentElement = anchor.element.parentElement
    const tweetElement = parentElement.querySelector("article");
    const tweetData = scrapeTweet(tweetElement);
    const [value,setValue] = useState(0)
    //const [tweetsStorage, setTweetsStorage] = useStorage("tweets", (t) => !t || t.length==0?[tweetData]:[...t,tweetData])


    tweetStorage.addTweet(tweetData)
    //MarkAsStored(tweetElement)
    if(isDev){
    setInterval(()=>{
        tweetStorage.GetStatus(tweetData.id).then((status)=>{
            if(status === "INSERTED"){
                ChangeBackgroundColor(tweetElement,"green")
            }
            else if(status === "SAVED"){
                ChangeBackgroundColor(tweetElement,"yellow")
            }
            else if (status === "NOT_SAVED"){
                ChangeBackgroundColor(tweetElement,"red")
            }
        })


    },1000)}
    //console.log(tweetData);
    if(tweetData.engagement.likes> 100000){
        parentElement.innerHTML = `<div> too many likes </div>`
    }

    //NotEndorsedAnymore(tweetElement)

    tweetStorage.inserted().then(v=>setValue(v));

  return (
    <>inserted: {value}
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