import React, { type SVGAttributes } from 'react';
import { generateAnonymousId, generateAvatarSVG } from './ObfuscationUtils';
import { DevLog } from './devUtils';
import { GlobalCachedData } from '~contents/Storage/CachedData';

export const TweetEnhancements = {
    enhanceTweet: async (tweetElement, badgeText,backgroundColor, gradientBackgroundColor, hoverGradientBackgroundColor) => {
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
                badge.style.backgroundColor = backgroundColor; //'#FF1493';
                badge.style.color = 'white';
                badge.style.padding = '2px 8px';
                badge.style.borderRadius = '12px';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = 'bold';
                badge.style.marginLeft = '8px';
                badge.style.display = 'inline-flex';  // Changed to inline-flex
                badge.style.alignItems = 'center';    // Center content vertically
                badge.style.justifyContent = 'center'; // Center content horizontally
                badge.style.whiteSpace = 'nowrap';    // Prevent text wrapping
                badge.style.width = 'fit-content';    // Only as wide as content
                badge.style.minWidth = 'min-content'; // Minimum width based on content
                badge.style.maxWidth = 'max-content'; // Maximum width based on content
                badge.style.height = 'auto';          // Height adjusts to content
                
                badge.textContent = badgeText;
                nameContainer.appendChild(badge);
            }

            // 3. Add a distinctive background to the tweet
            const tweetCard = tweetElement.closest('article');
            if (tweetCard) {
                // Add gradient background
                //tweetCard.style.background = backgroundColor;
                tweetCard.style.borderRight = `1px solid ${backgroundColor}`;
                tweetCard.style.transition = 'all 0.3s ease';
                
                // Enhanced hover effect
                tweetCard.addEventListener('mouseenter', () => {
                    tweetCard.style.transform = 'translateX(4px)';
                    //tweetCard.style.background = hoverBackgroundColor;
                });
                
                tweetCard.addEventListener('mouseleave', () => {
                    tweetCard.style.transform = 'translateX(0)';
                    //tweetCard.style.background = backgroundColor;
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

    enhanceOriginalPoster: async (tweetElement) => {
        try {
            // Add a crown icon next to the username
            const usernameElement = tweetElement.querySelector('div[data-testid="Tweet-User-Avatar"]').parentElement;
            
            if (usernameElement && !usernameElement.querySelector('.op-sprout')) {
                const sprout = document.createElement('div');
                sprout.className = 'op-sprout';
                sprout.innerHTML = '🌱';
                sprout.style.marginLeft = '4px';
                sprout.style.fontSize = '16px';
                usernameElement.appendChild(sprout);
            }

            // Add a special border
            const tweetCard = tweetElement.closest('article');
            if (tweetCard) {
                tweetCard.style.border = '1px solid gold';
                tweetCard.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
            }
        } catch (error) {
            console.error('Error enhancing original poster tweet:', error);
        }
    },

    enhanceMutualTweet: async (tweetElement) => {
        return TweetEnhancements.enhanceTweet(tweetElement, 'MUTUAL', '#FF7A32', 'linear-gradient(45deg, #fff 0%, #ffe6f3 100%)', 'linear-gradient(45deg, #fff 0%, #ffd6ec 100%)');
    },

    enhanceFollowerTweet: async (tweetElement) => {
        return TweetEnhancements.enhanceTweet(tweetElement, 'FOLLOWER','#2ED5E8', 'linear-gradient(45deg, #e0f7fa 0%, #b2ebf2 100%)', 'linear-gradient(45deg, #e0f7fa 0%, #80deea 100%)');
    },

    enhanceFollowingTweet: async (tweetElement) => {
        return TweetEnhancements.enhanceTweet(tweetElement, 'FOLLOWING','#92FF32', 'linear-gradient(45deg, #ffe0b2 0%, #ffcc80 100%)', 'linear-gradient(45deg, #ffe0b2 0%, #ffb74d 100%)');
    },

    obfuscateUser: async (tweetElement: HTMLElement) => {
        try {
            const avatarContainer = tweetElement.querySelector('[data-testid^="UserAvatar-Container"]');
            const displayNameElement = tweetElement.querySelector('div[data-testid="User-Name"] a[role="link"]') as HTMLAnchorElement;
            const usernameElement = tweetElement.querySelector('div[data-testid="User-Name"] span');


            const quotedTweet = tweetElement.querySelector('div[class*="r-eqz5dr"][class*="r-jusfrs"]');
            //DevLog("quotedTweet",quotedTweet)
            //if(quotedTweet) {
            //    TweetEnhancements.obfuscateUser(quotedTweet as HTMLElement);
            //}
            
            if (!avatarContainer || !usernameElement || !displayNameElement) {
                DevLog('Could not find required elements', { 
                    avatarFound: !!avatarContainer, 
                    usernameFound: !!usernameElement, 
                    displayNameFound: !!displayNameElement 
                });
                return;
            }
            const href = displayNameElement.href 
            // Get original username for consistent anonymization
            const originalUsername = href.split('/').pop() || '';
            const anonymousId = originalUsername.toLowerCase().startsWith('user')? originalUsername: generateAnonymousId(originalUsername);
             

            DevLog('Obfuscation process:', JSON.stringify({
                originalUsername,
                generatedAnonymousId: anonymousId,
                tweetElementId: tweetElement.attributes.getNamedItem('aria-labelledby')?.value || 'no-id',
                currentAvatarText: avatarContainer?.textContent,
                currentUsernameText: usernameElement?.textContent,
                timestamp: new Date().toISOString()
            }));

            DevLog(originalUsername, "anonymousId ", anonymousId);

             // Get the original container size
             const containerStyle = window.getComputedStyle(avatarContainer);
             const size = parseInt(containerStyle.width) || 40; // Default to 40px if can't get width
 

            // Find the image container using structural selectors
            // This looks for either:
            // 1. A div containing an img element
            // 2. A div with a background-image style
            const imageContainer = (
                avatarContainer.querySelector('div > img')?.parentElement || 
                avatarContainer.querySelector('div[style*="background-image"]')
            );


            if (imageContainer) {
                // Store the parent element before we modify anything
                const parentElement = imageContainer.parentElement;
                // Clear out the image container and its parent
                if (parentElement) {
                    parentElement.innerHTML = '';
                    // Add our SVG
                    parentElement.innerHTML = generateAvatarSVG(anonymousId, size,originalUsername);
                }

                // Clean up any other image elements or background images in the container
                avatarContainer.querySelectorAll('img').forEach(img => img.remove());
                avatarContainer.querySelectorAll('div[style*="background-image"]').forEach(div => {
                    if (div instanceof HTMLElement) {
                        div.style.backgroundImage = 'none';
                    }
                });
            }

            // 2. Replace username and display name
            if (usernameElement) {
                usernameElement.textContent = `■■■■■■■■■`;
            }
            displayNameElement.textContent = anonymousId;

            //// 3. Add hover effect to show it's obfuscated
            //const tweetCard = tweetElement.closest('article');
            //if (tweetCard) {
            //    tweetCard.style.transition = 'all 0.3s ease';
            //    
            //    // Add a subtle indicator that this tweet is obfuscated
            //    const obfuscationIndicator = document.createElement('div');
            //    obfuscationIndicator.style.position = 'absolute';
            //    obfuscationIndicator.style.top = '8px';
            //    obfuscationIndicator.style.right = '8px';
            //    obfuscationIndicator.style.fontSize = '12px';
            //    obfuscationIndicator.style.color = '#666';
            //    obfuscationIndicator.style.padding = '4px 8px';
            //    obfuscationIndicator.style.borderRadius = '4px';
            //    obfuscationIndicator.style.backgroundColor = '#f0f0f0';
            //    obfuscationIndicator.textContent = '🔒 Obfuscated';
            //    
            //    if (!tweetCard.querySelector('.obfuscation-indicator')) {
            //        obfuscationIndicator.className = 'obfuscation-indicator';
            //        tweetCard.style.position = 'relative';
            //        tweetCard.appendChild(obfuscationIndicator);
            //    }
            //}

        } catch (error) {
            console.error('Error obfuscating user:', error);
        }
    },
    enhanceSignalBoostingUrls: async (tweetElement: HTMLElement, onSignalBoostClick: () => void) => {
        try {
            // Find all links in the tweet
            const links = tweetElement.querySelectorAll('[data-testid="tweetText"] a[role="link"]') as NodeListOf<HTMLAnchorElement>;
            
            links.forEach(link => {
                if (!(link instanceof HTMLElement)) return;
                
                //DevLog("link", link.href)
                // Skip user mentions and hashtags
                if (link.href.includes('/hashtag/') || link.href.includes('/status/') || link.href.includes('x.com')   || !link.href.includes('http')) return;

                // Check if wrapper doesn't already exist
                if (link.parentElement?.classList.contains('signal-boost-link-wrapper')) return;

                // Create wrapper for the enhanced link
                const wrapper = document.createElement('span');
                wrapper.className = 'signal-boost-link-wrapper';
                wrapper.style.display = 'inline-flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '4px';
                wrapper.style.padding = '2px 8px';
                wrapper.style.margin = '0 2px';
                wrapper.style.borderRadius = '12px';
                wrapper.style.background = 'linear-gradient(45deg, rgba(29, 161, 242, 0.1), rgba(120, 86, 255, 0.1))';
                wrapper.style.transition = 'all 0.2s ease';

                // Create boost icon
                const boostIcon = document.createElement('span');
                boostIcon.innerHTML = '📢';
                boostIcon.style.fontSize = '14px';
                boostIcon.style.opacity = '0';
                boostIcon.style.transform = 'scale(0.8)';
                boostIcon.style.transition = 'all 0.2s ease';
                boostIcon.style.cursor = 'pointer';

                // Wrap the original link
                link.parentNode?.insertBefore(wrapper, link);
                wrapper.appendChild(boostIcon);
                wrapper.appendChild(link);

                // Add hover effects
                wrapper.addEventListener('mouseenter', () => {
                    wrapper.style.background = 'linear-gradient(45deg, rgba(29, 161, 242, 0.2), rgba(120, 86, 255, 0.2))';
                    wrapper.style.transform = 'translateY(-1px)';
                    boostIcon.style.opacity = '1';
                    boostIcon.style.transform = 'scale(1)';
                });

                wrapper.addEventListener('mouseleave', () => {
                    wrapper.style.background = 'linear-gradient(45deg, rgba(29, 161, 242, 0.1), rgba(120, 86, 255, 0.1))';
                    wrapper.style.transform = 'translateY(0)';
                    boostIcon.style.opacity = '0';
                    boostIcon.style.transform = 'scale(0.8)';
                });

                // Add click animation
                wrapper.addEventListener('mousedown', () => {
                    wrapper.style.transform = 'translateY(0)';
                });

                wrapper.addEventListener('mouseup', () => {
                    wrapper.style.transform = 'translateY(-1px)';
                });

                // Add signal boost click handler
                boostIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    DevLog("signal boost clicked")
                    if (onSignalBoostClick) {
                        onSignalBoostClick();
                    }
                });
            });

        } catch (error) {
            console.error('Error enhancing signal boosting URLs:', error);
        }
    },
    enhanceHighEngagementTweet: async (tweetElement: HTMLElement) => {
        try {
            // Skip if already enhanced
            if (tweetElement.classList.contains('high-engagement-enhanced')) return;
            tweetElement.classList.add('high-engagement-enhanced');
    
            // Find the main tweet content container
            const tweetCard = tweetElement.querySelectorAll('div[aria-labelledby],div[lang]');
            
            if (!tweetCard) return;
            for (const element of tweetCard) {
                if (!(element instanceof HTMLElement)) continue;
                // Apply initial dimmed state
                element.style.transition = 'all 0.2s ease';
                element.style.filter = 'blur(3px) brightness(0.7)';
                element.style.opacity = '0.5';
    
                // Add hover interactions
                element.addEventListener('mouseenter', () => {
                    element.style.filter = 'none';
                    element.style.opacity = '1';
                });
    
                element.addEventListener('mouseleave', () => {
                    element.style.filter = 'blur(3px) brightness(0.7)';
                    element.style.opacity = '0.5';
                });
            }
    
        } catch (error) {
            console.error('Error enhancing high engagement tweet:', error);
        }
    },

    //TODO: Add the UI components for this
    applyTextModifiers : async (tweetElement: HTMLElement) => {
        const textElement = tweetElement.querySelector('[data-testid="tweetText"] span')
        if(!textElement) return;
        if(textElement.classList.contains("tweet-text-modifiers")) return;
        textElement.classList.add("tweet-text-modifiers")
        
        const originalText = textElement.textContent;
        let newText = originalText;

        // Get text replacements from GlobalCachedData
        const replacements = await GlobalCachedData.GetTextModifiers() || [];
        if(!replacements || replacements.length == 0) return;
        // Apply each replacement
        DevLog("replacements " + replacements.length, (replacements))
        replacements.forEach(replacement => {
            newText = newText.replace(
                new RegExp(replacement.from, 'g'), 
                replacement.to
            );
        });
        
        textElement.textContent = newText;
        
        // Add hover functionality to show original text
        textElement.addEventListener('mouseenter', () => {
            textElement.textContent = originalText;
        });
        
        textElement.addEventListener('mouseleave', () => {
            textElement.textContent = newText;
        });
    },

    enhanceTweetWithLongTweetText: async (tweetElement: HTMLElement, text: string) => {
        const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]:first-of-type') as HTMLElement;
        const tweetTextSpan = tweetElement.querySelector('[data-testid="tweetText"]:first-of-type span');
        
        if(!tweetTextSpan) return;
        const tweetShowMoreElement = tweetElement.querySelector('[data-testid="tweet-text-show-more-link"]');

        if(tweetShowMoreElement) {
            tweetShowMoreElement?.remove();

            
            const originalText = tweetTextSpan.textContent;
            let newText = text;

            
            //tweetElement.style.display = 'block';
            tweetTextElement.style.webkitLineClamp = 'none';

            tweetTextSpan.textContent = text;
        }
       
    }
        
};
