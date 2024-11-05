export const TweetEnhancements = {
    enhanceTweet: async (tweetElement, badgeText, backgroundColor, hoverBackgroundColor) => {
        try {
            // Find the avatar and username elements
            const avatarContainer = tweetElement.querySelector('[data-testid="Tweet-User-Avatar"]');
            const usernameElement = tweetElement.querySelector('div[data-testid="User-Name"] a[role="link"]');
            
            if (!avatarContainer || !usernameElement) return;

            // 1. Add a dramatic avatar effect
            const avatarInner = avatarContainer.querySelector('div[style*="background-color"]');
            if (avatarInner) {
                // Create a pulsing glow effect
                avatarInner.style.animation = 'pulse 2s infinite';
                avatarInner.style.boxShadow = `
                    0 0 0 3px #ffffff,
                    0 0 0 6px #FF1493,
                    0 0 20px rgba(255, 20, 147, 0.5)
                `;
                avatarInner.style.borderRadius = '50%';
                avatarInner.style.transform = 'scale(1.05)';
            }

            // 2. Add a badge next to the username
            const nameContainer = usernameElement.parentElement;
            if (nameContainer && !nameContainer.querySelector('.mutual-badge')) {
                const badge = document.createElement('span');
                badge.className = 'mutual-badge';
                badge.style.backgroundColor = '#FF1493';
                badge.style.color = 'white';
                badge.style.padding = '2px 8px';
                badge.style.borderRadius = '12px';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = 'bold';
                badge.style.marginLeft = '8px';
                badge.style.display = 'inline-block';
                badge.textContent = badgeText;
                nameContainer.appendChild(badge);
            }

            // 3. Add a distinctive background to the tweet
            const tweetCard = tweetElement.closest('article');
            if (tweetCard) {
                // Add gradient background
                tweetCard.style.background = backgroundColor;
                tweetCard.style.borderLeft = '4px solid #FF1493';
                tweetCard.style.transition = 'all 0.3s ease';
                
                // Enhanced hover effect
                tweetCard.addEventListener('mouseenter', () => {
                    tweetCard.style.transform = 'translateX(4px)';
                    tweetCard.style.background = hoverBackgroundColor;
                });
                
                tweetCard.addEventListener('mouseleave', () => {
                    tweetCard.style.transform = 'translateX(0)';
                    tweetCard.style.background = backgroundColor;
                });
            }

            // 4. Add animation keyframes if they don't exist
            if (!document.querySelector('#mutual-animations')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'mutual-animations';
                styleSheet.textContent = `
                    @keyframes pulse {
                        0% { box-shadow: 0 0 0 3px #ffffff, 0 0 0 6px #FF1493, 0 0 20px rgba(255, 20, 147, 0.5); }
                        50% { box-shadow: 0 0 0 3px #ffffff, 0 0 0 8px #FF1493, 0 0 30px rgba(255, 20, 147, 0.7); }
                        100% { box-shadow: 0 0 0 3px #ffffff, 0 0 0 6px #FF1493, 0 0 20px rgba(255, 20, 147, 0.5); }
                    }
                `;
                document.head.appendChild(styleSheet);
            }
        } catch (error) {
            console.error('Error enhancing tweet:', error);
        }
    },

    enhanceMutualTweet: async (tweetElement) => {
        return TweetEnhancements.enhanceTweet(tweetElement, 'MUTUAL', 'linear-gradient(45deg, #fff 0%, #ffe6f3 100%)', 'linear-gradient(45deg, #fff 0%, #ffd6ec 100%)');
    },

    enhanceFollowerTweet: async (tweetElement) => {
        return TweetEnhancements.enhanceTweet(tweetElement, 'FOLLOWER', 'linear-gradient(45deg, #e0f7fa 0%, #b2ebf2 100%)', 'linear-gradient(45deg, #e0f7fa 0%, #80deea 100%)');
    },

    enhanceFollowingTweet: async (tweetElement) => {
        return TweetEnhancements.enhanceTweet(tweetElement, 'FOLLOWING', 'linear-gradient(45deg, #ffe0b2 0%, #ffcc80 100%)', 'linear-gradient(45deg, #ffe0b2 0%, #ffb74d 100%)');
    }
};