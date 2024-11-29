import { useEffect, useState } from 'react'
import { Switch } from '~components/ui/switch'
import { GlobalCachedData, TweetEnhancementPreferencesManager, type TweetEnhancementPreferences } from '~contents/Storage/CachedData'
import { getUser } from '~utils/dbUtils'



function TweetEnhancementConfig() {
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

  const updatePreference = async (key: keyof TweetEnhancementPreferences, value: boolean) => {
    const newPreferences = {
      ...preferences,
      [key]: value
    }
    setPreferences(newPreferences)
    await GlobalCachedData.SaveEnhancementPreferences(newPreferences)
  }

  if(!user) return <div>Please sign in to send feedback</div>

  

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Tweet Enhancement Settings</h2>

      <div className="space-y-4">
    {preferencesMetadata && preferencesMetadata.map((prefMetadata) => (
       <div id={prefMetadata.preference} className="flex items-center justify-between">
       <div>
         <h3 className="text-lg font-medium">{prefMetadata.title}</h3>
         <p className="text-sm text-gray-500">{prefMetadata.subtitle}</p>
       </div>
       <Switch className={`bg-blue-600`} onCheckedChange={(checked) => updatePreference(prefMetadata.preference as keyof TweetEnhancementPreferences, checked)} />
     </div>

    ))}
      
      </div>
    </div>
  )
}

export default TweetEnhancementConfig
