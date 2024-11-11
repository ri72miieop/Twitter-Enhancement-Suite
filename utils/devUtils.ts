export const DevLog = (message: string, type: "info" | "warn" | "error" | "debug" = "info") => {
  if (process.env.NODE_ENV === "development") {
    switch (type) {
      case "warn":
        console.warn(`[DEV-WARN] ${message}`)
        break
      case "error": 
        console.error(`[DEV-ERROR] ${message}`)
        break
      case "debug":
        console.debug(`[DEV-DEBUG] ${message}`)
        break
      default:
        console.log(`[DEV-INFO] ${message}`)
    }
  }
}   