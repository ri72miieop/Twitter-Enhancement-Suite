import type { PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"

import { GlobalCachedData } from "./Storage/CachedData"
import { DevLog } from "~utils/devUtils"
import { getUser, type UserMinimal } from "~utils/dbUtils"

export const config: PlasmoCSConfig = {
  matches: ["https://*.x.com/*"],
  run_at: "document_start"
}

async function init() {
  console.log("Initializing extension intercept")

  // In your extension's content script
  window.addEventListener(
    "dataInterceptedEvent",
    async (event: CustomEvent) => {

      const user: UserMinimal = await getUser();
      //if(!user) throw new Error("User not found")
      const userid = user?.id || "anon";
      const canScrape = await GlobalCachedData.GetCanScrape(userid)
      //res.send({ success: canScrape, userid: userid, canScrape: canScrape });
     if(!canScrape) {DevLog("User is blocked from scraping"); return;}
  

      // Now we can safely use extension APIs
      console.log(
        "Interceptor.extension.event - dataInterceptedEvent event received"
      )
      let data = event.detail.data 
      let type = event.detail.type
      try {
        //while (data.length > 0) {
          const dataObject = data //.shift()

          const response = await sendToBackground({
            name: "send-intercepted-data",
            body: {
              data: dataObject,
              type: type,
              originator_id: event.detail.originator_id,
              item_id: event.detail.item_id,
              timestamp: dataObject.timestamp,
              userid: userid
            }
          })
       // }
      } catch (error) {
        console.error("Interceptor.extension.event - Error sending data to background:", error)
      }
    }
  )
}

init()
