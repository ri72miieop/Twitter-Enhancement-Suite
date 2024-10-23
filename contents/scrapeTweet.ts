export function scrapeTweet(tweetElement) {
    // Helper function to safely extract numbers from text
    const extractNumber = (text) => {
        if (!text) return 0;
        // Remove thousand separators and convert 'mil' to thousands
        const normalized = text.replace(/\./g, '')
                             .replace(/\s*mil/i, '000');
        return parseInt(normalized, 10) || 0;
    };

    // Helper function to safely query elements
    const safeQuerySelector = (element, selector) => {
        return element.querySelector(selector)?.textContent?.trim() || '';
    };

    try {
        // Get tweet ID from the timestamp link
        const tweetLink = tweetElement.querySelector('a[href*="/status/"]')?.href || '';
        const tweetId = tweetLink.split('/status/')[1]?.split(/[^0-9]/)[0] || '';

        // Get author information
        const authorName = safeQuerySelector(tweetElement, '[data-testid="User-Name"] div[dir="ltr"]:first-child');
        const handleElement = tweetElement.querySelector('div[data-testid="User-Name"] div:last-child a[role="link"][href^="/"');
        const authorHandle = handleElement ? handleElement.href.trim().replace('https://x.com/', '') : '';
        const isVerified = !!tweetElement.querySelector('[data-testid="User-Name"] svg[aria-label]');

        // Get tweet content
        const tweetContent = safeQuerySelector(tweetElement, '[data-testid="tweetText"]');

        // Get timestamp
        const timestamp = tweetElement.querySelector('time')?.getAttribute('datetime') || '';

        // Get engagement metrics
        const replies = extractNumber(safeQuerySelector(tweetElement, '[data-testid="reply"] div[dir="ltr"] span'));
        const reposts = extractNumber(safeQuerySelector(tweetElement, '[data-testid="retweet"] div[dir="ltr"] span'));
        const likes = extractNumber(safeQuerySelector(tweetElement, '[data-testid="like"] div[dir="ltr"] span'));
        const bookmarks = extractNumber(safeQuerySelector(tweetElement, '[data-testid="bookmark"] div[dir="ltr"] span'));
        
        // Get view count
        const viewsText = tweetElement.querySelector('[data-testid="app-text-transition-container"] span')?.textContent || '0';
        const views = extractNumber(viewsText);

        return {
            id: tweetId,
            author: {
                name: authorName,
                handle: authorHandle,
                verified: isVerified
            },
            content: tweetContent,
            timestamp: new Date(timestamp),
            engagement: {
                replies,
                reposts,
                likes,
                bookmarks,
                views
            }
        };
    } catch (error) {
        console.error('Error scraping tweet:', error);
        return null;
    }
}