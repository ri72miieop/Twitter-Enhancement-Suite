import type { PlasmoMessaging } from "@plasmohq/messaging"

import { supabase } from "~core/supabase"
import { DevLog } from "~utils/devUtils"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const botToken = process.env.PLASMO_PUBLIC_TELEGRAM_BOT_TOKEN
    const chatId = process.env.PLASMO_PUBLIC_TELEGRAM_CHAT_ID

    const prefix = process.env.NODE_ENV === "development" ? "DEV|" : ""

    const feedback = req.body.feedback
    const user = req.body.user
    const username = user.username

    const text = `${prefix}${username} - ${feedback}`

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send feedback.`);
      }

      DevLog("Feedback sent successfully", "debug");
      res.send({ success: true });
    } catch (error) {
      DevLog(`Error sending feedback: ${error.message}`, "error"); 
      res.send({ success: false, error: error.message });
    }
}

export default handler
