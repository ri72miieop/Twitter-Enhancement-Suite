import { sendToBackground } from "@plasmohq/messaging"
import { faFilter, faRotate, faDownload, faFileZipper } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useEffect, useState } from "react"

import { indexDB, type TimedObject, type TimedObjectWithCanSendToCA } from "~utils/IndexDB"
import { DevLog } from "~utils/devUtils"
import posthog from "~core/posthog"
import { getUser } from "~utils/dbUtils"
import { downloadDataAsJson, downloadDataByOriginator, downloadAsZip } from "~utils/zipUtils"
import "~/prod.css"
type GroupedData = {
  [key: string]: TimedObjectWithCanSendToCA[]
}

// List of error reasons that can be reprocessed
const REPROCESSABLE_ERRORS = [
  "Error processing tweet.",
  "Error uploading to Supabase"
]

const InterceptorDashboard = () => {
  const [data, setData] = useState<GroupedData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedCanSendStatus, setSelectedCanSendStatus] = useState<string>("all")
  const [selectedReason, setSelectedReason] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const [processingReasons, setProcessingReasons] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadType, setDownloadType] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await sendToBackground({
          name: "get-all-intercepted-data"
        })
        DevLog("Response from background:", response)
        if (!response.success) {
          DevLog("Error fetching data from background:", response.error,"error")
          throw new Error(response.error || "Failed to fetch data")
        }

        const allData = response.data
        const grouped = allData.reduce((acc: GroupedData, item) => {
          const type = item.type || "unknown"
          if (!acc[type]) {
            acc[type] = []
          }
          acc[type].push(item)
          return acc
        }, {})

        setData(grouped)
        setError(null)
      } catch (error) {
        DevLog("Error fetching data from background:", error,"error")
        setError("Failed to load data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(fetchData, 30000)

    return () => clearInterval(intervalId)
  }, [])

  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      "api_tweet-detail": "bg-blue-100",
      "api_home-timeline": "bg-green-100",
      "api_user-tweets": "bg-yellow-100",
      "api_search-timeline": "bg-purple-100",
      "api_following": "bg-pink-100",
      "api_followers": "bg-orange-100"
    }
    return colors[type] || "bg-gray-100"
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "Not sent"
    return new Date(timestamp).toLocaleString()
  }

  const getUniqueReasons = () => {
    const reasons = new Set<string>()
    Object.values(data).flat().forEach((item) => {
      if (item.reason) {
        reasons.add(item.reason)
      }
    })
    return Array.from(reasons)
  }

  const filterData = (items: TimedObjectWithCanSendToCA[]) => {
    return items.filter((item) => {
      const matchesType = selectedType === "all" || item.type === selectedType
      

      const matchesCanSend = selectedCanSendStatus === "all"
        || (selectedCanSendStatus === "yes" && item.canSendToCA === true)
        || (selectedCanSendStatus === "no" && item.canSendToCA === false)

      const matchesReason = selectedReason === "all" 
        || item.reason === selectedReason

      return matchesType && matchesCanSend && matchesReason
    }).sort((a, b) => {
      return new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
    })
  }

  // Function to handle reprocessing all items with a specific reason
  const handleReprocessByReason = async (reason: string) => {
    try {
      // Add reason to processing set to show loading state
      setProcessingReasons(prev => new Set(prev).add(reason))
      const user = await getUser();
      // Get all items with this reason
      const itemsToReprocess = Object.values(data)
        .flat()
        .filter(item => item.reason === reason)
      
      // Process each item
      for (const item of itemsToReprocess) {
        const response = await sendToBackground({
          name: "send-intercepted-data",
          body: {
            originator_id: item.originator_id,
            item_id: item.item_id,
            type: item.type,
            data: item.data,
            userid: item.user_id,
            date_added: item.date_added
          }
        })
        
        if (!response.success && isReprocessableReason(response.error)) {
          posthog.capture("reprocess_error", {
            user_id: user?.id??"anon",
            error: response.error,
            data: item,
            timestamp: new Date().toISOString()
          })
        }

        DevLog("Reprocessed item:",item, "Success:", response.success)
      }
      
      // Refresh data after successful reprocessing
      const updatedResponse = await sendToBackground({
        name: "get-all-intercepted-data"
      })
      
      if (!updatedResponse.success) {
        DevLog("Error fetching data from background after reprocessing:", updatedResponse.error,"error")
        throw new Error(updatedResponse.error || "Failed to refresh data")
      }
      
      const allData = updatedResponse.data
      const grouped = allData.reduce((acc: GroupedData, dataItem) => {
        const type = dataItem.type || "unknown"
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(dataItem)
        return acc
      }, {})
      
      setData(grouped)
      
    } catch (error) {
      DevLog("Error reprocessing items:", error,"error")
      setError(`Failed to reprocess items: ${error.message}`)
    } finally {
      // Remove reason from processing set
      setProcessingReasons(prev => {
        const updated = new Set(prev)
        updated.delete(reason)
        return updated
      })
    }
  }

  // Check if a reason is reprocessable
  const isReprocessableReason = (reason: string): boolean => {
    return REPROCESSABLE_ERRORS.includes(reason)
  }

  const renderDataCard = (item: TimedObjectWithCanSendToCA) => {
    const isProcessing = item.reason && processingReasons.has(item.reason)
    
    return (
      <div
        key={`${item.originator_id}-${item.item_id}`}
        className={`${getTypeColor(
          item.type
        )} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-gray-600">{item.type}</span>
          <span className="text-xs text-gray-500">
            Sent to CA at: {formatTimestamp(item.timestamp)}
          <br />
            Added to localdb at: {new Date(item.date_added).toLocaleString()}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-medium">ID:</span> {item.item_id}
          </p>
          <p className="text-sm">
            <span className="font-medium">Originator:</span> {item.originator_id}
          </p>
          <p className="text-sm">
            <span className="font-medium">User ID:</span>{" "}
            {item.user_id || "Not available"}
          </p>
          {item.canSendToCA !== undefined && (
            <p className="text-sm">
              <span className="font-medium">Can Send to CA:</span>{" "}
              {item.canSendToCA ? "Yes" : "No"}
            </p>
          )}
          {item.reason && (
            <p className="text-sm text-red-600">
              <span className="font-medium">Reason:</span> {item.reason}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Function to handle downloading all data
  const handleDownloadAllData = async () => {
    try {
      setIsDownloading(true)
      setDownloadType('all')
      
      // Get all data from all types
      const allData = Object.values(data).flat()
      
      DevLog(`Preparing to download all data (${allData.length} items)`)
      
      // Download all data as a single JSON file
      downloadDataAsJson(allData)
      
      setError(null)
    } catch (error) {
      DevLog("Error downloading data:", error, "error")
      setError(`Failed to download data: ${error.message}`)
    } finally {
      // Add a small delay before resetting the state to ensure the user sees the loading state
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadType(null)
      }, 1000)
    }
  }
  
  // Function to handle downloading data by originator
  const handleDownloadByOriginator = async () => {
    try {
      setIsDownloading(true)
      setDownloadType('byOriginator')
      
      // Get all data from all types
      const allData = Object.values(data).flat()
      
      DevLog(`Preparing to download data by originator (${allData.length} items)`)
      
      // Download data grouped by originator
      downloadDataByOriginator(allData)
      
      setError(null)
      
      // Keep the loading state for a bit longer since downloads are staggered
      setTimeout(() => {
        DevLog("Download by originator process completed")
        setIsDownloading(false)
        setDownloadType(null)
      }, 5000) // Give enough time for downloads to start
    } catch (error) {
      DevLog("Error downloading data by originator:", error, "error")
      setError(`Failed to download data by originator: ${error.message}`)
      setIsDownloading(false)
      setDownloadType(null)
    }
  }
  
  // Function to handle downloading data as a zip file
  const handleDownloadAsZip = async () => {
    try {
      setIsDownloading(true)
      setDownloadType('zip')
      
      // Get all data from all types
      const allData = Object.values(data).flat()
      
      DevLog(`Preparing to download data as zip (${allData.length} items)`)
      
      // Download data as a zip file with each originator as a separate JSON file
      await downloadAsZip(allData)
      
      setError(null)
    } catch (error) {
      DevLog("Error downloading data as zip:", error, "error")
      setError(`Failed to download data as zip: ${error.message}`)
    } finally {
      // Add a small delay before resetting the state to ensure the user sees the loading state
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadType(null)
      }, 1000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const types = ["all", ...Object.keys(data)]
  const uniqueReasons = getUniqueReasons()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Intercepted Data Dashboard</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Download Buttons */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={handleDownloadAllData}
          disabled={isDownloading || Object.keys(data).length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            ${isDownloading || Object.keys(data).length === 0
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'}`}>
          <FontAwesomeIcon 
            icon={faDownload} 
            className={`h-4 w-4 ${downloadType === 'all' ? 'animate-spin' : ''}`} 
          />
          {downloadType === 'all' ? 'Downloading...' : 'Download All Data (Single File)'}
        </button>
        
        <button
          onClick={handleDownloadByOriginator}
          disabled={isDownloading || Object.keys(data).length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            ${isDownloading || Object.keys(data).length === 0
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          <FontAwesomeIcon 
            icon={faDownload} 
            className={`h-4 w-4 ${downloadType === 'byOriginator' ? 'animate-spin' : ''}`} 
          />
          {downloadType === 'byOriginator' ? 'Downloading...' : 'Download Latest By Originator ID'}
        </button>
        
        <button
          onClick={handleDownloadAsZip}
          disabled={isDownloading || Object.keys(data).length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            ${isDownloading || Object.keys(data).length === 0
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
              : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
          <FontAwesomeIcon 
            icon={faFileZipper} 
            className={`h-4 w-4 ${downloadType === 'zip' ? 'animate-spin' : ''}`} 
          />
          {downloadType === 'zip' ? 'Creating Zip...' : 'Download Latest As Zip (By Originator)'}
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(data).map(([type, items]) => {
          const filteredItems = filterData(items)
          return (
            <div
              key={type}
              className={`${getTypeColor(
                type
              )} rounded-lg p-4 text-center shadow-sm`}>
              <p className="text-sm font-medium text-gray-600">{type}</p>
              <p className="text-2xl font-bold text-gray-800">
                {filteredItems.length}
              </p>
              <p className="text-xs text-gray-500">items</p>
            </div>
          )
        })}
      </div>

      {/* Reprocess Buttons for Each Reprocessable Error */}
      <div className="mb-6 flex flex-wrap gap-4">
        {uniqueReasons
          .filter(isReprocessableReason)
          .map(reason => {
            const isProcessing = processingReasons.has(reason)
            const itemCount = Object.values(data)
              .flat()
              .filter(item => item.reason === reason)
              .length
              
            return (
              <button
                key={reason}
                onClick={() => handleReprocessByReason(reason)}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                  ${isProcessing 
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                <FontAwesomeIcon 
                  icon={faRotate} 
                  className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} 
                />
                {isProcessing ? 'Processing...' : `Reprocess ${itemCount} items with "${reason}"`}
              </button>
            )
          })}
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon 
            icon={faFilter} 
            className="h-4 w-4 text-gray-500" 
          />
          <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {/* Type Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>


          {/* Can Send to CA Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Can Send to CA
            </label>
            <select
              value={selectedCanSendStatus}
              onChange={(e) => {
                setSelectedCanSendStatus(e.target.value)
                if (e.target.value !== "no") {
                  setSelectedReason("all")
                }
              }}
              className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Reason Filter - Only show when Can Send to CA is "no" */}
          {selectedCanSendStatus === "no" && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Reason
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                <option value="all">All Reasons</option>
                {getUniqueReasons().map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data).map(([type, items]) => {
          const filteredItems = filterData(items)
          return filteredItems.map((item) => renderDataCard(item))
        })}
      </div>
    </div>
  )
}

export default InterceptorDashboard
