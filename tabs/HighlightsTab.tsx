import { useState, useEffect } from "react"
import AccountTopTweetsClient from "~components/AccountTopTweetsClient"
import PageChangeDetector from "~components/PageChanger"
import Tweet from "~components/Tweet"
import TweetList from "~components/TweetList"
import { supabase } from "~core/supabase"
import { fetchTopTweetsByUser } from "~utils/dbUtils"
import { extractXUsername } from "~utils/TwitterUtils"


function HighlightsTab() {
    const [topTweets, setTopTweets] = useState<any[]>(null)
    const [url, setUrl] = useState<string>(null)
    const [username, setUsername] = useState<string>(null)
    const [usernameExistsInCA, setUsernameExistsInCA] = useState<boolean|null>(null)

    useEffect(() =>{

      async function updateUsername(){

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const currentTab = tabs[0];
          const currentUrl = currentTab.url;
          const currentTitle = currentTab.title;
      
          console.log(`Current URL: ${currentUrl}`);

          const username = extractXUsername(currentUrl)
          setUsername(username);
          setUrl(currentUrl)
          console.log(`Current Title: ${currentTitle}`);
      });
        
      }

      updateUsername()
      console.log("updateUsername",window.location)

    },[window.location])



    useEffect(()=>{

      async function checkUsernameExistsInCA(){
        if(username){
          const {data,error} = await supabase.from('account').select('account_id,username,account_display_name').eq('username',username).single()
          if(data && !error){
            setUsernameExistsInCA(true)
            console.log("username exists in CA")
          }
          else{
            setUsernameExistsInCA(false)
            console.log("username doesn't exist in CA")
          }
        }
      }
      checkUsernameExistsInCA()

    },[username])

    useEffect(() => {

        async function fetchData() {
          


          console.log(JSON.stringify(url, null, 2))
            console.log("fetching data")
            const data = await fetchTopTweetsByUser(username)
            console.log(data)
            const tweetData = {
                // liked: data.most_liked_tweets_by_archive_users,
                // replied: data.most_replied_tweets_by_archive_users,
                favorited: data.most_favorited_tweets,
                retweeted: data.most_retweeted_tweets,
            } 
            
            
            const {data:account} = await supabase.from('account').select('account_id,username,account_display_name').eq('username',username);
            const {data:profile} = await supabase.from('profile').select('*').eq('account_id',account[0].account_id);

            console.log(tweetData.favorited);
            for(let i = 0; i < tweetData.favorited.length; i++){

              tweetData.favorited[i].avatar_media_url = profile[0].avatar_media_url;
              tweetData.favorited[i].username = account[0].username;
              tweetData.favorited[i].account_display_name = account[0].account_display_name;
            }


            setTopTweets(tweetData.favorited)
            

            
        }
        if(usernameExistsInCA != null && usernameExistsInCA){
        fetchData()
        }
    }, [usernameExistsInCA])

    
// <AccountTopTweetsClient
// tweetData={topTweets}
// username="IaimforGOAT"
// displayName="IaimforGOAT"
// profilePicUrl="https://pbs.twimg.com/profile_images/1712168250441146368/4Fg5g55a_400x400.jpg"
// />

  return (<>
  
  {usernameExistsInCA!= null && !usernameExistsInCA &&(
<span>Sorry, this user didn't add his archive to the Community Archive yet.</span>
  )}
  {usernameExistsInCA &&topTweets && topTweets.map((tweet: any) => (
    <Tweet key={tweet.tweet_id} tweet={tweet} />
  ))}
  </>)
}

export default HighlightsTab
