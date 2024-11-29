export const DevLog = (...args: any[]) => {
  const type = typeof args[args.length-1] === 'string' && ["info", "warn", "error", "debug"].includes(args[args.length-1])
    ? args.pop() as "info" | "warn" | "error" | "debug"
    : "info";

  const message = args.map(arg =>
    typeof arg === 'string' ? arg : JSON.stringify(arg)
  ).join(' ');

  if (process.env.NODE_ENV === "development") {
    // Get stack trace
    const stack = new Error().stack;
    // Convert stack to array of lines, skip first line (Error message)
    const stackLines = stack?.split('\n').slice(1) || [];
    
    // Filter stack to only show project files
    // Adjust this regex based on your project structure
    const projectStackLines = stackLines
      //.filter(line => line.includes('/src/')) // Filter to only show lines from your src directory
      .map(line => line.trim())
      .join('\n');

    let logMessage = `[DEV-${type.toUpperCase()}] ${message}`;

    switch (type) {
      case "warn":
        console.warn(logMessage);
        break;
      case "error":
        logMessage += `\n\nStack trace:\n${projectStackLines}`;
        console.error(logMessage);
        break;
      case "debug":
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
};

export const isDev = process.env.NODE_ENV === "development"