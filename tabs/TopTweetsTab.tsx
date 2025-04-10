import { useEffect, useState } from "react"

import AccountTopTweetsClient from "~components/AccountTopTweetsClient"

import Tweet from "~components/Tweet"
import TweetList from "~components/TweetList"
import { supabase } from "~core/supabase"
import { fetchTopTweetsByUser } from "~utils/dbUtils"
import { DevLog } from "~utils/devUtils"
import { extractXUsername } from "~utils/TwitterUtils"

function TopTweetsTab() {
  const [topTweets, setTopTweets] = useState<any[]>(null)
  const [url, setUrl] = useState<string>(null)
  const [username, setUsername] = useState<string>(null)
  const [usernameExistsInCA, setUsernameExistsInCA] = useState<boolean | null>(
    null
  )

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
        DevLog(`Initial URL: ${currentUrl}`)
        DevLog(`isIgnored: ${urlsToIgnore.some(url => currentUrl.includes(url))}`);
        if (!urlsToIgnore.some(url => currentUrl.includes(url))) {
        const username = extractXUsername(currentUrl)
        setUsername(username)}
        setUrl(currentUrl)
      }
    }
  
    const updateUsernameFromUrl = async (url: string) => {
      DevLog(`Current URL: ${url}`)
      DevLog(`isIgnored: ${urlsToIgnore.some(urlsToIgnore => url.includes(urlsToIgnore))}`);
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
          DevLog("username exists in CA")
          return true;
        } else {
          setUsernameExistsInCA(false)
          DevLog("username doesn't exist in CA")
          return false;
        }
      }
    }
    
  
    async function fetchData() {
      if (!username) return
      DevLog(JSON.stringify(url, null, 2))
      DevLog("fetching data")
      const data = await fetchTopTweetsByUser(username)
      DevLog(data)
      const tweetData = {
        // liked: data.most_liked_tweets_by_archive_users,
        // replied: data.most_replied_tweets_by_archive_users,
        favorited: data.most_favorited_tweets,
        retweeted: data.most_retweeted_tweets
      }

      const { data: account } = await supabase
        .from("account")
        .select("account_id,username,account_display_name")
        .eq("username", username)
      const { data: profile } = await supabase
        .from("profile")
        .select("*")
        .eq("account_id", account[0].account_id)

      for (let i = 0; i < tweetData.favorited.length; i++) {
        tweetData.favorited[i].avatar_media_url = profile[0].avatar_media_url
        tweetData.favorited[i].username = account[0].username
        tweetData.favorited[i].account_display_name =
          account[0].account_display_name
      }

      setTopTweets(tweetData.favorited)
    }

    checkUsernameExistsInCA().then((exists) => {
      if (exists) {
        fetchData()
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
          Sorry, <b>@{username}</b> didn't add their archive to the Community Archive
          yet.
        </span>
      )}
      {usernameExistsInCA &&
        topTweets &&
        topTweets.map((tweet: any) => (
          <Tweet key={tweet.tweet_id} tweet={tweet} />
        ))}
    </>
  )
}

export default TopTweetsTab
