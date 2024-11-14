import { useState, useRef, useEffect } from "react"
import SearchTab from "./tabs/SearchTab"
import HighlightsTab from "./tabs/HighlightsTab"
import OurConversationsTab from "./tabs/OurConversationsTab"

import "./prod.css"
import OnThisDay from "~tabs/OnThisDay"
import ChatRoom from "~tabs/Chatroom"


const navOptions = [
  { 
    key: "highlights", 
    label: "Highlights", 
    description: "See this user's most liked tweets of all time.",
    component: HighlightsTab
  },
  //{ 
  //  key: "ourConversations", 
  //  label: "Our Conversations", 
  //  description: "See previous conversations between you and this user.",
  //  component: OurConversationsTab
  //},
  { 
    key: "search", 
    label: "Search", 
    description: "Search for specific tweets or content.",
    component: SearchTab
  },
  { 
    key: "thisDay", 
    label: "On This Day", 
    description: "Same day and month; different year. Both your own tweets and your faves.",
    component: OnThisDay
  },
  //{ 
  //  key: "chatroom", 
  //  label: "Chatroom", 
  //  description: "Chat with this user.",
  //  component: ChatRoom
  //},
]

const IndexSidePanel = () => {


  const [activeOption, setActiveOption] = useState(navOptions[0].key)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentIndex = navOptions.findIndex(option => option.key === activeOption)
  const prevOption = navOptions[(currentIndex - 1 + navOptions.length) % navOptions.length]
  const nextOption = navOptions[(currentIndex + 1) % navOptions.length]

  const handleOptionChange = (direction) => {
    const newIndex = (currentIndex + direction + navOptions.length) % navOptions.length
    setActiveOption(navOptions[newIndex].key)
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

  const ActiveComponent = navOptions.find(option => option.key === activeOption)?.component || null

  return (
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
              {navOptions.find(option => option.key === activeOption)?.label}▼
            </button>
            {isDropdownOpen && (
              <div style={dropdownStyle}>
                {navOptions.map((option) => (
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
