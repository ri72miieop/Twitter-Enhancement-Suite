import { useState, useRef, useEffect } from "react"
import SearchTab from "./tabs/SearchTab"
import TopTweetsTab from "./tabs/TopTweetsTab"
import OurConversationsTab from "./tabs/OurConversationsTab"

import "./prod.css"
import OnThisDay from "~tabs/OnThisDay"
import ChatRoom from "~tabs/Chatroom"
import { getUser } from "~utils/dbUtils"
import FeedbackTab from "~tabs/FeedbackTab"
import { supabase } from "~core/supabase"
import { DevLog, isDev } from "~utils/devUtils"
import TweetEnhancementConfigTab from "~tabs/TweetEnhancementConfigTab"
import ShadCN from "~tabs/ShadCN"
import SignalBoostedTweets, { SignalBoostedTweetsTab } from "~tabs/SignalBoostedTweetsTab"




const navOptions = [
  { 
    key: "toptweets", 
    isEnabled: true,
    label: "Top Tweets", 
    description: "The most liked tweets of all time from this user.",
    component: TopTweetsTab
  },
  { 
    key: "ourConversations", 
    isEnabled: false,
    label: "Our Conversations", 
    description: "See previous conversations between you and this user.",
    component: OurConversationsTab
  },
  { 
    key: "search", 
    isEnabled: true,
    label: "Search", 
    description: "Search for specific tweets or content.",
    component: SearchTab
  },
  { 
    key: "thisDay", 
    isEnabled: true,
    label: "On This Day", 
    description: "Same day and month; different year. Both your own tweets and your faves.",
    component: OnThisDay
  },
  { 
    key: "chatroom", 
    isEnabled: isDev,
    label: "Chatroom", 
    description: "Chat with this user.",
    component: ChatRoom
  },
  {
    key: "feedback",
    isEnabled: true,
    label: "Feedback",
    description: "Send feedback to the developer.",
    component: FeedbackTab
  },
  {
    key: "ShadCN",
    isEnabled: isDev,
    label: "ShadCN",
    description: "ShadCN components.",
    component: ShadCN
  },
  {
    key: "signalBoostedTweets",
    isEnabled: isDev,
    label: "Signal Boosted Tweets",
    description: "See tweets that have been boosted by this user.",
    component: SignalBoostedTweetsTab
  },
  {
    key: "tweetEnhancement",
    isEnabled: true,
    label: "Tweet Enhancement",
    description: "Configure tweet enhancement features.",
    component: TweetEnhancementConfigTab
  }
]

const IndexSidePanel = () => {

  const enabledNavOptions = isDev ? navOptions : navOptions.filter(option => option.isEnabled)
  const [activeOption, setActiveOption] = useState(enabledNavOptions[0].key)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [user, setUser] = useState(getUser())


  const currentIndex = enabledNavOptions.findIndex(option => option.key === activeOption)
  const prevOption = enabledNavOptions[(currentIndex - 1 + enabledNavOptions.length) % enabledNavOptions.length]
  const nextOption = enabledNavOptions[(currentIndex + 1) % enabledNavOptions.length]



  const handleOptionChange = (direction) => {
    const newIndex = (currentIndex + direction + enabledNavOptions.length) % enabledNavOptions.length
    setActiveOption(enabledNavOptions[newIndex].key)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
    
  }, [])

  const ActiveComponent = enabledNavOptions.find(option => option.key === activeOption)?.component || null
  
  return (<>
  {user && (

  
    <div style={{ display: "flex", flexDirection: "column", height: "90vh", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <button onClick={() => handleOptionChange(-1)} style={arrowButtonStyle}>
            ← <span style={adjacentOptionStyle}>{prevOption.label}</span>
          </button>
          <div ref={dropdownRef} style={{ position: "relative", flex: 1 }}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={activeOptionStyle}
            >
              {enabledNavOptions.find(option => option.key === activeOption)?.label}▼
            </button>
            {isDropdownOpen && (
              <div style={dropdownStyle}>
                {enabledNavOptions.map((option) => (
                  <div 
                    key={option.key}
                    onClick={() => {
                      setActiveOption(option.key)
                      setIsDropdownOpen(false)
                    }}
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f8fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <strong>{option.label}</strong>
                    <p style={{ margin: 0, fontSize: "0.9em" }}>{option.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => handleOptionChange(1)} style={arrowButtonStyle}>
            <span style={adjacentOptionStyle}>{nextOption.label}</span> →
          </button>
        </div>
      </div>
      {ActiveComponent && <ActiveComponent />}
    </div>
    )}
    {!user && (
      <div className="flex flex-col items-center justify-center h-[90vh] p-4 text-center">
        <p className="text-gray-600 mb-2">Please</p>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="text-blue-500 hover:text-blue-600 font-medium underline underline-offset-2 transition-colors"
        >
          sign in
        </button>
        <p className="text-gray-600 mt-2">to use the extension features.</p>
      </div>
    )}
    </>
  )
}

const arrowButtonStyle = {
  padding: "8px 12px",
  backgroundColor: "transparent",
  color: "#1da1f2",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  fontSize: "12px",  // Reduced size for side options
}

const adjacentOptionStyle = {
  margin: "0 8px",
  color: "#657786",
  fontSize: "12px",  // Reduced size for side options
}

const activeOptionStyle = {
  padding: "8px 16px",
  backgroundColor: "#f5f8fa",
  color: "#14171a",
  border: "1px solid #e1e8ed",
  borderRadius: 20,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  fontSize: "14px",  // Slightly larger than side options
}

const dropdownStyle = {
  position: "absolute",
  top: "100%",
  left: "-20%",  // Adjusted to make dropdown wider
  right: "-20%", // Adjusted to make dropdown wider
  backgroundColor: "white",
  border: "1px solid #e1e8ed",
  borderRadius: 4,
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  zIndex: 10,
  marginTop: 4,
}

const dropdownItemStyle = {
  padding: 16,  // Increased padding for larger text
  cursor: "pointer",
  borderBottom: "1px solid #e1e8ed",
  ':hover': {
    backgroundColor: "#f5f8fa",
  },
  fontSize: "14px",  // Increased font size in dropdown
}

export default IndexSidePanel
