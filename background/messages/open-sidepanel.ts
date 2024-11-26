import type { PlasmoMessaging } from "@plasmohq/messaging"

// Define message metadata type
type MessagesMetadata = {

    open: boolean
  
}

// Update handler with the metadata type
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    console.log("Opening side panel")
    try {
        if(req.body.open) {
            // Get the current window
      const currentWindow = await chrome.windows.getCurrent()
      
      if (!currentWindow?.id) {
        throw new Error("Could not get current window ID")
      }

      // Open the side panel with the correct window ID
      await chrome.sidePanel.open({ windowId: currentWindow.id })
            res.send({ success: true })

        } else {
            
            res.send({ success: true })
        }
    } catch (error) {
        res.send({ success: false, error: error })
        console.error("Error opening side panel:", error)
    }
}

export default handler;