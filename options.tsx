import type { Provider, User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { supabase } from "~core/supabase"
import { GlobalCachedData } from "~contents/Storage/CachedData"
import { DevLog } from "~utils/devUtils"



function IndexOptions() {
  const [user, setUser] = useStorage<User>({
    key: "user",
    instance: new Storage({
      area: "local"
    })
  })

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    async function init() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error(error)
        return
      }
      if (!!data.session) {
        setUser(data.session.user)
        sendToBackground({
          name: "init-session",
          body: {
            refresh_token: data.session.refresh_token,
            access_token: data.session.access_token
          }
        })
      }
    }

    init()
  }, [])

  const handleEmailLogin = async (
    type: "LOGIN" | "SIGNUP",
    username: string,
    password: string
  ) => {
    try {
      const {
        error,
        data: { user }
      } =
        type === "LOGIN"
          ? await supabase.auth.signInWithPassword({
              email: username,
              password
            })
          : await supabase.auth.signUp({ email: username, password })

      if (error) {
        alert("Error with auth: " + error.message)
      } else if (!user) {
        alert("Signup successful, confirmation mail should be sent soon!")
      } else {
        DevLog("user " + user.id, "debug")
        
        setUser(user)
      }
    } catch (error) {
      DevLog("error " + error, "error")
      alert(error.error_description || error)
    }
  }

  const handleOAuthLogin = async (provider: Provider) => {
    DevLog("redirectTo " + location.href, "debug")
    const { data,error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: location.href
      }

      
    })

    if (error) {
      alert("Error with auth: " + error.message)
    }
    if(data){
      DevLog("data " + data, "debug")
    }
  }

  const handleCacheReset = async () => {
    try {
      await GlobalCachedData.ResetAllCache()
      alert("Cache reset successful!")
    } catch (error) {
      DevLog("Error resetting cache:" + error, "error")
      alert("Error resetting cache")
    }
  }

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        top: 240,
        position: "relative"
      }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 240,
          justifyContent: "space-between",
          gap: 4.2
        }}>
        {user && (
          <>
            <h3>
              {user.email} - {user.id}
            </h3>
            <button
              onClick={() => {
                supabase.auth.signOut()
                setUser(null)
              }}>
              Logout
            </button>
            <button 
              onClick={handleCacheReset}
              style={{ marginTop: "10px" }}>
              Reset Cache
            </button>
          </>
        )}
        {!user && (
          <>
            <label>Email</label>
            <input
              type="text"
              placeholder="Your Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={(e) => {
                handleEmailLogin("SIGNUP", username, password)
              }}>
              Sign up
            </button>
            <button
              onClick={(e) => {
                handleEmailLogin("LOGIN", username, password)
              }}>
              Login
            </button>

            <button
              onClick={(e) => {
                handleOAuthLogin("twitter")
              }}>
              Sign in with Twitter
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default IndexOptions
