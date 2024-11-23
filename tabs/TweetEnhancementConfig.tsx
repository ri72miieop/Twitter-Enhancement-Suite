import { useEffect, useState } from 'react'
import { GlobalCachedData, type TweetEnhancementPreferences } from '~contents/Storage/CachedData'



function TweetEnhancementConfig() {
  const [preferences, setPreferences] = useState<TweetEnhancementPreferences>()

  useEffect(() => {
    // Load saved preferences on mount
    GlobalCachedData.GetEnhancementPreferences().then(savedPrefs => {
      if (savedPrefs) {
        setPreferences(savedPrefs)
      }
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

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (checked: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Tweet Enhancement Settings</h2>

      <div className="space-y-4">
    
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Obfuscate All Users</h3>
              <p className="text-sm text-gray-500">Apply obfuscation to all users, not just specific ones</p>
            </div>
            <ToggleSwitch
              checked={preferences?.obfuscateAllUsers ?? false}
              onChange={(checked) => updatePreference('obfuscateAllUsers', checked)}
            />
          </div>
        

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Show Relationship Badges</h3>
            <p className="text-sm text-gray-500">Display mutual/following/follower indicators</p>
          </div>
          <ToggleSwitch
            checked={preferences?.showRelationshipBadges ?? false}
            onChange={(checked) => updatePreference('showRelationshipBadges', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Show Original Poster Badge</h3>
            <p className="text-sm text-gray-500">Highlight tweets from the original poster</p>
          </div>
          <ToggleSwitch
            checked={preferences?.showOriginalPosterBadge ?? false}
            onChange={(checked) => updatePreference('showOriginalPosterBadge', checked)}
          />
        </div>
      </div>
    </div>
  )
}

export default TweetEnhancementConfig
