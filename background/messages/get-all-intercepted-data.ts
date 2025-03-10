import type { PlasmoMessaging } from "@plasmohq/messaging"

import { DevLog } from "~utils/devUtils"
import { indexDB } from "~utils/IndexDB"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    DevLog("__test__ Interceptor.background.message - get-all-intercepted-data: Starting request processing")
    DevLog("Interceptor.background.message - get-all-intercepted-data: Processing request with filters")
    
    // Extract filters and pagination from request
    const { type, canSendStatus, reason, page = 1, pageSize = 50 } = req.body || {}
    DevLog(`__test__ Request parameters: type=${type}, canSendStatus=${canSendStatus}, reason=${reason}, page=${page}, pageSize=${pageSize}`)
    
    // Define reprocessable reasons
    const REPROCESSABLE_REASONS = [
      "Error processing tweet.",
      "Error uploading to Supabase"
    ]
    
    // Fetch all data first
    // Start with the base query
    let query = indexDB.data.toCollection()
    DevLog("__test__ Created base query from indexDB.data collection")
    
    // Build filter conditions
    const filterConditions = []
    
    if (type && type !== "all") {
      filterConditions.push(item => item.type === type)
      DevLog(`__test__ Added type filter condition: ${type}`)
    }
    
    if (canSendStatus && canSendStatus !== "all") {
      const canSend = canSendStatus === "true"
      filterConditions.push(item => item.canSendToCA === canSend)
      DevLog(`__test__ Added canSendToCA filter condition: ${canSend}`)
    }
    
    if (reason && reason !== "all") {
      filterConditions.push(item => item.reason === reason)
      DevLog(`__test__ Added reason filter condition: ${reason}`)
    }
    
    // Apply all filters at once if there are any
    if (filterConditions.length > 0) {
      query = query.filter(item => filterConditions.every(condition => condition(item)))
      DevLog(`__test__ Applied ${filterConditions.length} filter conditions to query`)
    }
    
    // Get total count for pagination
    const totalCount = await query.count()
    DevLog(`__test__ Total count after filtering: ${totalCount}`)
    
    // Apply pagination
    const paginatedData = await query
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .toArray()
    DevLog(`__test__ Retrieved ${paginatedData.length} records after pagination (page ${page}, pageSize ${pageSize})`)
    
    // Get all data for statistics
    const allData = await indexDB.data.toArray()
    DevLog(`__test__ Retrieved ${allData.length} total records for statistics`)
    
    // Generate type counts
    const typeCounts = allData.reduce((acc, item) => {
      const type = item.type || "unknown"
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    DevLog(`__test__ Generated type counts: ${JSON.stringify(typeCounts)}`)
    
    // Count reprocessable items
    const reprocessableCountByReason = allData.reduce((acc, item) => {
      if (item.reason && REPROCESSABLE_REASONS.includes(item.reason)) {
        acc[item.reason] = (acc[item.reason] || 0) + 1;
      }
      return acc;
    }, {});
    DevLog(`__test__ Reprocessable items count: ${reprocessableCountByReason}`)
    
    // Generate reason counts
    const reasonCounts = allData.reduce((acc, item) => {
      if (item.reason) {
        acc[item.reason] = (acc[item.reason] || 0) + 1
      }
      return acc
    }, {})
    DevLog(`__test__ Generated reason counts: ${JSON.stringify(reasonCounts)}`)
    
    // Generate canSendToCA counts
    const canSendCounts = {
      true: allData.filter(item => item.canSendToCA === true).length,
      false: allData.filter(item => item.canSendToCA === false).length
    }
    DevLog(`__test__ Generated canSendToCA counts: ${JSON.stringify(canSendCounts)}`)
    
    DevLog(`Interceptor.background.message - get-all-intercepted-data: Returning ${paginatedData.length} of ${totalCount} filtered records`)
    DevLog("__test__ Preparing response payload")
    const responseData = { 
      success: true, 
      data: paginatedData,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      overview: {
        typeCounts,
        reasonCounts,
        canSendCounts,
        reprocessableCountByReason,
        totalRecords: allData.length
      }
    };
    res.send(responseData)
    DevLog("__test__ Response sent successfully",responseData)
  } catch (error) {
    DevLog("__test__ Error encountered during processing:", error)
    DevLog("Error processing data from IndexDB:", error)
    res.send({ 
      success: false, 
      error: error.message 
    })
  }
}

export default handler