import type { PlasmoCSConfig, PlasmoCSUIProps, PlasmoGetInlineAnchorList } from "plasmo"
import { useState } from "react"
import { useEffect } from "react"
import { getUser } from "~utils/dbUtils"
import { GlobalCachedData } from "./Storage/CachedData"
import { VirtualRoom } from "~components/VirtualRoom/VirtualRoom"
import { DevLog } from "~utils/devUtils"

export const config: PlasmoCSConfig = {
    matches: ["https://*.x.com/MakeTwitterGreatAgain/moots"],
    css: ["font.css"]
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
    const [moots, setMoots] = useState([]);

    useEffect(() => {
        async function loadMoots() {
            const user = await getUser();
            DevLog("user " + JSON.stringify(user), "debug");
            if(!user.id) return;
            const mootsList = await GlobalCachedData.GetMoots(user.id);
            setMoots(mootsList);
        }
        loadMoots();
    }, []);

    useEffect(() => {
        if (!mainElement) return;
        mainElement.innerHTML = '';
    }, [mainElement, moots]);
    
    return (
        <div>
            <h2 style={{
                padding: "20px",
                fontSize: "24px",
                color: "#333"
            }}>
                Your Moots ({moots.length})
            </h2>
            <ul style={{
                listStyle: "none",
                padding: "20px"
            }}>
                {moots.map(moot => (
                    <li key={moot.username} style={{
                        padding: "10px",
                        margin: "10px 0",
                        borderRadius: "8px",
                        background: "linear-gradient(45deg, #fff 0%, #ffe6f3 100%)"
                    }}>
                        @{moot.username}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default MootsPage