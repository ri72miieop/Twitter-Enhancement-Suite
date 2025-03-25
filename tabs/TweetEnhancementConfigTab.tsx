import { useEffect, useState } from 'react'
import { Switch } from '~components/ui/switch'
import { GlobalCachedData, TweetEnhancementPreferencesManager, type PreferenceMetadata, type TweetEnhancementPreferences } from '~contents/Storage/CachedData'
import { getUser } from '~utils/dbUtils'

import { Toaster } from "@/components/ui/shadcn/sonner"
import { toast } from "sonner"

import "~prod.css"

function TweetEnhancementConfigTab() {
  const [preferences, setPreferences] = useState<TweetEnhancementPreferences>()
  const [user, setUser] = useState<{id: any, username: any} | null>(null)
  const [preferencesMetadata] = useState(TweetEnhancementPreferencesManager.getPreferenceMetadata());
  useEffect(() => {
    // Load saved preferences on mount
    GlobalCachedData.GetEnhancementPreferences().then(savedPrefs => {
      if (savedPrefs) {
        setPreferences(savedPrefs)
      }
    })
    getUser().then(user => {
      if(!user) return
      setUser(user)
    })
  }, [])

  const updatePreference = async (preferenceMetadata: PreferenceMetadata, value: boolean) => {
    const key: keyof TweetEnhancementPreferences = preferenceMetadata.preference as keyof TweetEnhancementPreferences
    const newPreferences = {
      ...preferences,
      [key]: value
    }
    setPreferences(newPreferences)
    if(preferenceMetadata.disableRequiresRefresh && value === false){
      toast.warning("Please refresh the page to apply changes", {
        id: "refresh-required-toast"
      });
    }
    await GlobalCachedData.SaveEnhancementPreferences(newPreferences)
  }

  if(!user) return <div>Please sign in to send feedback</div>

  

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Tweet Enhancement Settings</h2>

      <div className="space-y-4">

    <Toaster />
    {preferencesMetadata && preferencesMetadata.filter(prefMetadata => prefMetadata.isEnabled).map((prefMetadata) => (
       <div id={prefMetadata.preference} className="flex items-center justify-between">
       <div>
         <h3 className="text-lg font-medium flex items-center gap-2">
           {prefMetadata.title}
           {prefMetadata.disableRequiresRefresh && (
             <span className="text-amber-500 cursor-help" title="Requires page refresh when disabled">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                 <path d="M21 3v5h-5"></path>
                 <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                 <path d="M8 16H3v5"></path>
               </svg>
             </span>
           )}
         </h3>
         <p className="text-sm text-gray-500">{prefMetadata.subtitle}</p>
       </div>
       <Switch className={`bg-blue-600`} checked={preferences?.[prefMetadata.preference as keyof TweetEnhancementPreferences] ?? false} onCheckedChange={(checked) => updatePreference(prefMetadata, checked)} />
     </div>

    ))}
      
      </div>
    </div>
  )
}

export default TweetEnhancementConfigTab
