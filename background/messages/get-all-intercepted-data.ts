import type { PlasmoMessaging } from "@plasmohq/messaging"

import { DevLog } from "~utils/devUtils"
import { indexDB } from "~utils/IndexDB"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    DevLog("Interceptor.background.message - get-all-intercepted-data: Fetching data from IndexDB")
    
    const allData = await indexDB.data.toArray()
    
    DevLog(`Interceptor.background.message - get-all-intercepted-data: Found ${allData.length} records`)
    
    res.send({ 
      success: true, 
      data: allData 
    })
  } catch (error) {
    DevLog("Error fetching data from IndexDB:", error)
    res.send({ 
      success: false, 
      error: error.message 
    })
  }
}

export default handler 