import cssText from "data-text:~/contents/X-overlay.css"
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*.x.com/*"],
  css: ["font.css"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const XOverlay = () => {
  return (
    <span
      className="hw-top"
      style={{
        padding: 12
      }}>
      CSUI OVERLAY FIXED POSITION
    </span>
  )
}

export default XOverlay