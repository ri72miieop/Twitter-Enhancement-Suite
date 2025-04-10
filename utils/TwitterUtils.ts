/**
 * Extracts username from an X (formerly Twitter) URL
 * @param {string} url - The X URL to parse
 * @returns {string|null} The username if found, null otherwise
 */
export function extractXUsername(url: string) {
    try {
        // Handle null or undefined input
        if (!url) {
            return null;
        }

        // Create URL object to parse the URL
        const urlObject = new URL(url);

        // Check if it's an X/Twitter domain
        if (!['x.com', 'twitter.com'].includes(urlObject.hostname)) {
            return null;
        }

        // Split the pathname and filter out empty strings
        const pathParts = urlObject.pathname.split('/').filter(Boolean);

        // Username should be the first part after the domain
        // Verify it's not a reserved path like 'status', 'home', etc.
        const reservedPaths = ['status', 'home', 'explore', 'notifications', 'messages','i'];
        if (pathParts.length > 0 && !reservedPaths.includes(pathParts[0])) {
            return pathParts[0];
        }

        return null;
    } catch (error) {
        // Return null for any parsing errors
        return null;
    }
}