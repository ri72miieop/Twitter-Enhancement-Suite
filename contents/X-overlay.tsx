import cssText from "data-text:~/contents/X-overlay.css"
import type { PlasmoCSConfig } from "plasmo"
import { DevLog } from "~utils/devUtils"

export const config: PlasmoCSConfig = {
  matches: ["https://*.x.com/ISTHISON/1*"],
  css: ["font.css"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const XOverlay = () => {
  DevLog("XOverlay")
  return (
    <span
      className="hw-top"
      style={{
        padding: 12
      }}>
      TES - OVERLAY FIXED POSITION
    </span>
  )
}

export default XOverlay