import { cleanupOldRecords } from '../utils/IndexDB'

// Run database cleanup on extension startup
async function runDatabaseCleanup() {
  try {
    const deletedRecords = await cleanupOldRecords(10000)
    if (deletedRecords > 0) {
      console.log(`Database cleanup completed: ${deletedRecords} old records deleted`)
    }
  } catch (error) {
    console.error('Error running database cleanup:', error)
  }
}

// Schedule the cleanup to run every 6 hours
function setupPeriodicCleanup() {
  // Run cleanup immediately on startup
  runDatabaseCleanup()
  
  // Set interval for every 6 hours (6 * 60 * 60 * 1000 ms)
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000
  setInterval(runDatabaseCleanup, SIX_HOURS_MS)
}

// Run on extension startup
setupPeriodicCleanup()

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage()
})

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)