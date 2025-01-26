import type { PlasmoCSConfig, PlasmoCSUIProps, PlasmoGetInlineAnchor, PlasmoGetInlineAnchorList, PlasmoMountShadowHost } from "plasmo"
import { useState } from "react"
import { useEffect } from "react"
import { getUser } from "~utils/dbUtils"
import { GlobalCachedData } from "./Storage/CachedData"
import { DevLog } from "~utils/devUtils"
import { useTwitterTheme } from "~hooks/TwitterTheme"

export const config: PlasmoCSConfig = {
    matches: ["https://*.x.com/MakeTwitterGreatAgain/moots"],
    
    
  }


  export const mountShadowHost: PlasmoMountShadowHost = ({
    shadowHost,
    anchor,
    mountState
  }) => {
      anchor.element.replaceWith(shadowHost)
    
    mountState.observer.disconnect() // OPTIONAL DEMO: stop the observer as needed
  }


export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  const anchors = document.querySelectorAll("main > div:first-child")
  return Array.from(anchors).map((element) => {   
    return {
      element,
      insertPosition: "beforebegin"
    }
  })
}

//export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
//    const anchor = document.querySelector("main > div:first-child")
//    
//    return {
//      element: anchor,
//      position: "afterbegin",  
//      createShadowRoot: false
//    }
//  }

const MootsPage = ({ anchor }: PlasmoCSUIProps) => {
    const parentElement = anchor.element.parentElement
    
    const [moots, setMoots] = useState([]);
    const theme = useTwitterTheme();

    // Theme-based colors
    const themeColors = {
        text: theme === 'dim' ? '#E7E9EA' : theme === 'dark' ? '#E7E9EA' : '#0F1419',
        background: theme === 'dim' ? '#15202B' : theme === 'dark' ? '#000000' : '#FFFFFF',
        cardGradient: theme === 'dim' 
            ? 'linear-gradient(45deg, #1C2732 0%, #22303C 100%)'
            : theme === 'dark'
                ? 'linear-gradient(45deg, #16181C 0%, #1D1F23 100%)'
                : 'linear-gradient(45deg, #F7F9F9 0%, #EFF3F4 100%)'
    };

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


    
    return (
        <div style={{
            background: themeColors.background,
            color: themeColors.text
        }}>
            <h2 style={{
                padding: "20px",
                fontSize: "24px",
                color: themeColors.text
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
                        background: themeColors.cardGradient,
                        color: themeColors.text
                    }}>
                        @{moot.username}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default MootsPage