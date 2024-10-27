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
    media?: {
      type: 'image' | 'video' | 'gif';
      urls: string[];
    };
  }
  
  export function scrapeTweet(tweetElement: Element): ScrapedTweet | null {
    const extractNumber = (text: string | undefined): number => {
      if (!text) return 0;
      const normalized = text.replace(/\./g, '').replace(/\s*mil/i, '000');
      return parseInt(normalized, 10) || 0;
    };
  
    const safeQuerySelector = (element: Element, selector: string): string => {
      return element.querySelector(selector)?.textContent?.trim() || '';
    };
  
    const extractMedia = (element: Element) => {
      const mediaContainer = element.querySelector('[data-testid="tweetPhoto"], [data-testid="tweetVideo"]');
      if (!mediaContainer) return undefined;
  
      const type = mediaContainer.getAttribute('data-testid') === 'tweetPhoto' ? 'image' : 'video';
      
      // Handle images
      if (type === 'image') {
        const images = Array.from(element.querySelectorAll('img[src*="media"]'))
          .map(img => img.getAttribute('src'))
          .filter((src): src is string => src !== null)
          // Convert to highest quality version
          .map(src => src.replace(/\?format=\w+&name=\w+/, '?format=png&name=large'));
        
        return images.length > 0 ? { type, urls: images } : undefined;
      }
  
      // Handle videos
      if (type === 'video') {
        const videoElement = element.querySelector('video');
        const posterUrl = videoElement?.getAttribute('poster');
        return posterUrl ? { type, urls: [posterUrl] } : undefined;
      }
  
      return undefined;
    };
  
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]')?.getAttribute('href') || '';
    const tweetId = tweetLink.split('/status/')[1]?.split(/[^0-9]/)[0] || '';
    
    if (!tweetId) {
      console.error("Could not extract tweet ID");
      return null;
    }
  
    try {
      // Author information
      const authorName = safeQuerySelector(tweetElement, '[data-testid="User-Name"] div[dir="ltr"]:first-child');
      const handleElement = tweetElement.querySelector('div[data-testid="User-Name"] div:last-child a[role="link"][href^="/"]');
      const authorHandle = handleElement ? handleElement.getAttribute('href')?.split('/').pop() || '' : '';
      const isVerified = !!tweetElement.querySelector('[data-testid="User-Name"] svg[aria-label*="verif"]');
  
      // Tweet content and timestamp
      const tweetContent = safeQuerySelector(tweetElement, '[data-testid="tweetText"]');
      const timestamp = tweetElement.querySelector('time')?.getAttribute('datetime') || '';
  
      // Engagement metrics
      const replies = extractNumber(safeQuerySelector(tweetElement, '[data-testid="reply"] div[dir="ltr"] span'));
      const reposts = extractNumber(safeQuerySelector(tweetElement, '[data-testid="retweet"] div[dir="ltr"] span'));
      const likes = extractNumber(safeQuerySelector(tweetElement, '[data-testid="like"] div[dir="ltr"] span'));
      const bookmarks = extractNumber(safeQuerySelector(tweetElement, '[data-testid="bookmark"] div[dir="ltr"] span'));
      const viewsText = tweetElement.querySelector('[data-testid="app-text-transition-container"] span')?.textContent || '0';
      const views = extractNumber(viewsText);
  
      // Media content
      const media = extractMedia(tweetElement);
  
      const tweet: ScrapedTweet = {
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
        ...(media && { media })
      };
  
      return tweet;
  
    } catch (error) {
      console.error('Error scraping tweet:', error, tweetId);
      return null;
    }
  }