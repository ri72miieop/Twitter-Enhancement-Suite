import type { Provider, User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { supabase } from "~core/supabase"
import { DevLog } from "~utils/devUtils"
import SignIn from "~components/SignIn"

function PopupOptions() {
  return <>
  
  <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        top: 20,
        position: "relative"
      }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 240,
          justifyContent: "space-between",
          gap: 4.2
        }}><SignIn /> </div>
  </main>
  </>
}

export default PopupOptions
