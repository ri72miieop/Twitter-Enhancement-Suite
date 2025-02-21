import Tweet from "~components/Tweet"
import  { supabase } from "~core/supabase"
import { useEffect, useState } from "react"

import { fetchTopTweetsByUser } from "~utils/dbUtils"
import  { DevLog } from "~utils/devUtils"
import  { extractXUsername } from "~utils/TwitterUtils"

function OurConversationsTab() {
    const [topTweets, setTopTweets] = useState<any[]>(null)
    const [url, setUrl] = useState<string>(null)
    const [username, setUsername] = useState<string>(null)
    const [usernameExistsInCA, setUsernameExistsInCA] = useState<boolean | null>(
      null
    )
    const [interactions, setInteractions] = useState<any[]>(null)
    const [interactionStats, setInteractionStats] = useState<any>(null)
  
    const urlsToIgnore = ["x.com/compose/post","x.com/settings/","x.com/jobs"]
  
    useEffect(() => {
      const updateUsername = async () => {
        // Get the active tab in the current window
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true
        })
        const currentTab = tabs[0]
        if (currentTab?.url) {
          const currentUrl = currentTab.url
          const currentTitle = currentTab.title
          DevLog(`tab.ourconversations.initial_url - ${currentUrl}`)
          DevLog(`tab.ourconversations.is_ignored_url - ${urlsToIgnore.some(url => currentUrl.includes(url))}`);
          if (!urlsToIgnore.some(url => currentUrl.includes(url))) {
          const username = extractXUsername(currentUrl)
          setUsername(username)}
          setUrl(currentUrl)
        }
      }
    
      const updateUsernameFromUrl = async (url: string) => {
        DevLog(`tab.ourconversations.current_url - ${url}`)
        DevLog(`tab.ourconversations.is_ignored_url - ${urlsToIgnore.some(urlsToIgnore => url.includes(urlsToIgnore))}`);
        if (!urlsToIgnore.some(urlsToIgnore => url.includes(urlsToIgnore))) {
  
        const username = extractXUsername(url)
        setUsername(username)}
        setUrl(url)
      }
    
      // Initial update
      updateUsername()
    
      // Listen for URL changes in any tab
      const tabUpdateListener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
        if (changeInfo.url) {
          // Only update if the changed tab is the active one
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id === tabId) {
              updateUsernameFromUrl(changeInfo.url)
            }
          })
        }
      }
    
      // Listen for tab switches
      const tabActivatedListener = async (activeInfo: chrome.tabs.TabActiveInfo) => {
        const tab = await chrome.tabs.get(activeInfo.tabId)
        if (tab.url) {
          updateUsernameFromUrl(tab.url)
        }
      }
    
      chrome.tabs.onUpdated.addListener(tabUpdateListener)
      chrome.tabs.onActivated.addListener(tabActivatedListener)
    
      return () => {
        chrome.tabs.onUpdated.removeListener(tabUpdateListener)
        chrome.tabs.onActivated.removeListener(tabActivatedListener)
      }
    }, [])
  
    useEffect(() => {
      async function checkUsernameExistsInCA() {
        if (username) {
          const { data, error } = await supabase
            .from("account")
            .select("account_id,username,account_display_name")
            .ilike("username", username)
            .single()
          if (data && !error) {
            setUsernameExistsInCA(true)
            DevLog("tab.ourconversations.username_exists_in_ca")
            return data;
          } else {
            setUsernameExistsInCA(false)
            DevLog("tab.ourconversations.username_not_in_ca")
            return null;
          }
        }
      }
      
    
      async function fetchData({
        account_id,username,account_display_name
    }: {
        account_id: any,
        username: any,
        account_display_name: any
    }) {
        if (!username) return
        DevLog(`tab.ourconversations.url_data - ${JSON.stringify(url, null, 2)}`)
        DevLog("tab.ourconversations.fetching_interactions")
        const {data} = await supabase.schema('tes').rpc('get_user_recent_interactions',{other_user_id:account_id}).select('*')
        DevLog(`tab.ourconversations.interactions_data - ${JSON.stringify(data, null, 2)}`)

        const {data:interactionStats} = await supabase.schema('tes').rpc('get_user_interaction_stats',{other_user_id:account_id}).select('*')
        setInteractions(data)
        setInteractionStats(interactionStats[0])
        DevLog(`tab.ourconversations.stats_data - ${JSON.stringify(interactionStats, null, 2)}`)
        DevLog(`tab.ourconversations.data - ${JSON.stringify(data, null, 2)}`)
      }
  
      checkUsernameExistsInCA().then((data) => {
        if (data) {
          fetchData(data)
        }
      })
    }, [username])
  
    // <AccountTopTweetsClient
    // tweetData={topTweets}
    // username="IaimforGOAT"
    // displayName="IaimforGOAT"
    // profilePicUrl="https://pbs.twimg.com/profile_images/1712168250441146368/4Fg5g55a_400x400.jpg"
    // />
  
    return (
      <>
        {usernameExistsInCA != null && !usernameExistsInCA && username && (
          <span>
            Sorry, <b>@{username}</b> isn't on Community Archive
            yet.
          </span>
        )}

        {usernameExistsInCA && interactionStats && (
          <div>
            <h2>Interaction Stats</h2>
            <p>Total Interactions: {interactionStats.total_interactions}</p>
            <p>Last Month Interactions: {interactionStats.last_month_interactions}</p>
            <p>Last Week Interactions: {interactionStats.last_week_interactions}</p>
          </div>
        )}
        {usernameExistsInCA &&
          interactions &&
          interactions.map((interaction: any) => (
            <Tweet key={interaction.tweet_id} tweet={interaction} />
          ))}
      </>
    )
  }



export default OurConversationsTab
