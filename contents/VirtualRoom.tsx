import type { PlasmoCSConfig, PlasmoCSUIProps, PlasmoGetInlineAnchorList } from "plasmo"

import { useEffect } from "react"

import { VirtualRoom } from "~components/VirtualRoom/VirtualRoom"

export const config: PlasmoCSConfig = {
    matches: ["https://*.x.com/MakeTwitterGreatAgain/VirtualRoom"],
    
  }

  export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
    const anchors = document.querySelectorAll("main")
    return Array.from(anchors).map((element) => {   
      return {
        element,
        insertPosition: "beforebegin"
      }
    })
  }
  
const MootsPage = ({ anchor }: PlasmoCSUIProps) => {
    const parentElement = anchor.element.parentElement
    const mainElement = parentElement.querySelector("main");


    useEffect(() => {
        if (!mainElement) return;
        mainElement.innerHTML = '';
    }, [mainElement]);
    
    return (
        <div>
            <VirtualRoom />
        </div>
    )
}

export default MootsPage