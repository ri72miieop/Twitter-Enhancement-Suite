import { sendToBackground } from "@plasmohq/messaging"
import { faFilter } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useEffect, useState } from "react"

import { indexDB, type TimedObject, type TimedObjectWithCanSendToCA } from "~utils/IndexDB"
import { DevLog } from "~utils/devUtils"

type GroupedData = {
  [key: string]: TimedObjectWithCanSendToCA[]
}

const InterceptorDashboard = () => {
  const [data, setData] = useState<GroupedData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedTimestampStatus, setSelectedTimestampStatus] = useState<string>("all")
  const [selectedCanSendStatus, setSelectedCanSendStatus] = useState<string>("all")
  const [selectedReason, setSelectedReason] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await sendToBackground({
          name: "get-all-intercepted-data"
        })
        DevLog("Response from background:", response)
        if (!response.success) {
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
        DevLog("Error fetching data from background:", error)
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
      
      const matchesTimestamp = selectedTimestampStatus === "all" 
        || (selectedTimestampStatus === "not processed" && !item.timestamp)
        || (selectedTimestampStatus === "processed" && item.timestamp)

      const matchesCanSend = selectedCanSendStatus === "all"
        || (selectedCanSendStatus === "yes" && item.canSendToCA === true)
        || (selectedCanSendStatus === "no" && item.canSendToCA === false)

      const matchesReason = selectedReason === "all" 
        || item.reason === selectedReason

      return matchesType && matchesTimestamp && matchesCanSend && matchesReason
    }).sort((a, b) => {
      return new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
    })
  }


  const renderDataCard = (item: TimedObjectWithCanSendToCA) => (
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const types = ["all", ...Object.keys(data)]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Intercepted Data Dashboard</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

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

          {/* Timestamp Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Processing Status
            </label>
            <select
              value={selectedTimestampStatus}
              onChange={(e) => setSelectedTimestampStatus(e.target.value)}
              className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              <option value="all">All</option>
              <option value="not processed">Not Processed</option>
              <option value="processed">Processed</option>
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
    </div>
  )
}

export default InterceptorDashboard
