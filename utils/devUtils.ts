export const DevLog = (...args: any[]) => {
  const type = typeof args[args.length-1] === 'string' && ["info", "warn", "error", "debug"].includes(args[args.length-1]) 
    ? args.pop() as "info" | "warn" | "error" | "debug"
    : "info";
  const message = args.map(arg => 
    typeof arg === 'string' ? arg : JSON.stringify(arg)
  ).join(' ');
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