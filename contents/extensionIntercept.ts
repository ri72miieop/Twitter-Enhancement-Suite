import type { PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"

import { getUser, type UserMinimal } from "~utils/dbUtils"
import { DevLog } from "~utils/devUtils"

import { GlobalCachedData } from "./Storage/CachedData"

export const config: PlasmoCSConfig = {
  matches: ["https://*.x.com/*"],
  run_at: "document_start"
}

async function init() {
  DevLog("Initializing extension intercept")

  // In your extension's content script
  window.addEventListener(
    "dataInterceptedEvent",
    async (event: CustomEvent) => {
      const user: UserMinimal = await getUser()
      //if(!user) throw new Error("User not found")
      const userid = user?.id || "anon"

      let data = event.detail.data
      let type = event.detail.type
      try {
        const dataObject = data

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
      } catch (error) {
        console.error(
          "Interceptor.extension.event - Error sending data to background:",
          error
        )
      }
    }
  )
}

init()
