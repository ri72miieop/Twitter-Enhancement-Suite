export interface ScrapedTweet {
    id: string;
    author: {
      name: string;
      handle: string;
      verified: boolean;
    };
    content: string;
    timestamp: Date;
    engagement: {
      replies: number;
      reposts: number;
      likes: number;
      bookmarks: number;
      views: number;
    };
  }

export function scrapeTweet(tweetElement) : ScrapedTweet | null {
    const extractNumber = (text) => {
        if (!text) return 0;
        const normalized = text.replace(/\./g, '').replace(/\s*mil/i, '000');
        return parseInt(normalized, 10) || 0;
    };

    const safeQuerySelector = (element, selector) => {
        return element.querySelector(selector)?.textContent?.trim() || '';
    };


    const tweetLink = tweetElement.querySelector('a[href*="/status/"]')?.href || '';
    const tweetId = tweetLink.split('/status/')[1]?.split(/[^0-9]/)[0] || '';

    if (!tweetId) {  // Handle cases where tweet ID extraction fails
        console.error("Could not extract tweet ID");
        return null;
    }


    try {
        const authorName = safeQuerySelector(tweetElement, '[data-testid="User-Name"] div[dir="ltr"]:first-child');
        const handleElement = tweetElement.querySelector('div[data-testid="User-Name"] div:last-child a[role="link"][href^="/"');
        const authorHandle = handleElement ? handleElement.href.split('/').pop() : ''; // More robust handle extraction
        const isVerified = !!tweetElement.querySelector('[data-testid="User-Name"] svg[aria-label]');

        const tweetContent = safeQuerySelector(tweetElement, '[data-testid="tweetText"]');

        const timestamp = tweetElement.querySelector('time')?.getAttribute('datetime') || '';

        const replies = extractNumber(safeQuerySelector(tweetElement, '[data-testid="reply"] div[dir="ltr"] span'));
        const reposts = extractNumber(safeQuerySelector(tweetElement, '[data-testid="retweet"] div[dir="ltr"] span'));
        const likes = extractNumber(safeQuerySelector(tweetElement, '[data-testid="like"] div[dir="ltr"] span'));
        const bookmarks = extractNumber(safeQuerySelector(tweetElement, '[data-testid="bookmark"] div[dir="ltr"] span'));

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
            },

        };


    } catch (error) {
        console.error('Error scraping tweet:', error, tweetId); // Include tweetId for debugging
        return null;
    }
}