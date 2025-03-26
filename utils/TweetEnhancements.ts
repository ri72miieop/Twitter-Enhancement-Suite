import React, { type SVGAttributes } from 'react';
import { generateAnonymousId, generateAvatarSVG } from './ObfuscationUtils';
import { DevLog } from './devUtils';

import { detectTwitterTheme, useTwitterTheme } from '~hooks/TwitterTheme';
import { GlobalCachedData } from '~contents/Storage/CachedData';

export const TweetEnhancements = {
    enhanceTweet: async (tweetElement, badgeText, backgroundColor, gradientBackgroundColor, hoverGradientBackgroundColor) => {
        try {
            // Find the avatar and username elements
            const avatarContainer = tweetElement.querySelector('[data-testid="Tweet-User-Avatar"]');
            const usernameElement = tweetElement.querySelector('div[data-testid="User-Name"]');
            
            if (!avatarContainer || !usernameElement) return;

            // Store original styles before modifying
            const avatarInner = avatarContainer.querySelector('div[style*="background-color"]');
            if (avatarInner && !avatarInner.dataset.originalStyles) {
                avatarInner.dataset.originalStyles = JSON.stringify({
                    animation: avatarInner.style.animation,
                    boxShadow: avatarInner.style.boxShadow,
                    borderRadius: avatarInner.style.borderRadius,
                    transform: avatarInner.style.transform
                });

                avatarInner.classList.add('enhanced-avatar');
                avatarInner.style.animation = 'pulse 2s infinite';
                avatarInner.style.boxShadow = `
                    0 0 0 3px #ffffff,
                    0 0 0 6px #FF1493,
                    0 0 20px rgba(255, 20, 147, 0.5)
                `;
                avatarInner.style.borderRadius = '50%';
                avatarInner.style.transform = 'scale(1.05)';
            }

            // Add badge if not already present
            const nameContainer = usernameElement;
            if (nameContainer && !nameContainer.querySelector('.mutual-badge')) {
                const badge = document.createElement('span');
                badge.className = 'mutual-badge';
                badge.style.backgroundColor = backgroundColor;
                badge.style.color = 'white';
                badge.style.padding = '2px 8px';
                badge.style.borderRadius = '12px';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = 'bold';
                badge.style.marginLeft = '4px';
                badge.style.display = 'inline-flex';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'start';
                badge.style.whiteSpace = 'nowrap';
                badge.style.width = 'fit-content';
                badge.style.minWidth = '0';
                badge.style.maxWidth = 'max-content';
                badge.style.height = 'auto';
                badge.style.flexShrink = '999';
                badge.style.textOverflow = 'ellipsis';

                
                badge.textContent = badgeText;
                nameContainer.appendChild(badge);
            }

            // Add tweet card enhancements
            const tweetCard = tweetElement.closest('article');
            if (tweetCard && !tweetCard.dataset.originalStyles) {
                tweetCard.dataset.originalStyles = JSON.stringify({
                    borderRight: tweetCard.style.borderRight,
                    transition: tweetCard.style.transition,
                    transform: tweetCard.style.transform
                });

                tweetCard.classList.add('enhanced-tweet-card');
                tweetCard.style.borderRight = `1px solid ${backgroundColor}`;
                tweetCard.style.transition = 'all 0.3s ease';
                
                const mouseEnterHandler = () => {
                    tweetCard.style.transform = 'translateX(4px)';
                };
                
                const mouseLeaveHandler = () => {
                    tweetCard.style.transform = 'translateX(0)';
                };
                
                tweetCard.addEventListener('mouseenter', mouseEnterHandler);
                tweetCard.addEventListener('mouseleave', mouseLeaveHandler);
                
                // Store handlers for removal
                tweetCard.dataset.mouseEnterHandler = mouseEnterHandler.toString();
                tweetCard.dataset.mouseLeaveHandler = mouseLeaveHandler.toString();
            }

            // Add animation keyframes if they don't exist
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

    removeTweetEnhancements: (tweetElement) => {
        try {
            // Restore avatar styles
            const avatarInner = tweetElement.querySelector('.enhanced-avatar');
            if (avatarInner && avatarInner.dataset.originalStyles) {
                const originalStyles = JSON.parse(avatarInner.dataset.originalStyles);
                Object.assign(avatarInner.style, originalStyles);
                delete avatarInner.dataset.originalStyles;
                avatarInner.classList.remove('enhanced-avatar');
            }

            // Remove badge
            const badge = tweetElement.querySelector('.mutual-badge');
            if (badge) {
                badge.remove();
            }

            // Restore tweet card styles
            const tweetCard = tweetElement.closest('article');
            if (tweetCard && tweetCard.dataset.originalStyles) {
                const originalStyles = JSON.parse(tweetCard.dataset.originalStyles);
                Object.assign(tweetCard.style, originalStyles);
                
                // Remove event listeners using stored handlers
                if (tweetCard.dataset.mouseEnterHandler) {
                    tweetCard.removeEventListener('mouseenter', new Function('return ' + tweetCard.dataset.mouseEnterHandler)());
                }
                if (tweetCard.dataset.mouseLeaveHandler) {
                    tweetCard.removeEventListener('mouseleave', new Function('return ' + tweetCard.dataset.mouseLeaveHandler)());
                }
                
                delete tweetCard.dataset.originalStyles;
                delete tweetCard.dataset.mouseEnterHandler;
                delete tweetCard.dataset.mouseLeaveHandler;
                tweetCard.classList.remove('enhanced-tweet-card');
            }

            // Remove animation styles if no enhanced tweets remain
            if (!document.querySelector('.enhanced-tweet-card')) {
                const styleSheet = document.querySelector('#mutual-animations');
                if (styleSheet) {
                    styleSheet.remove();
                }
            }
        } catch (error) {
            console.error('Error removing tweet enhancements:', error);
        }
    },

    enhanceOriginalPoster: async (tweetElement) => {
        try {
            const usernameElement = tweetElement.querySelector('div[data-testid="Tweet-User-Avatar"]').parentElement;
            
            if (usernameElement && !usernameElement.querySelector('.op-sprout')) {
                const sprout = document.createElement('div');
                sprout.className = 'op-sprout';
                sprout.innerHTML = '🌱';
                sprout.style.marginLeft = '4px';
                sprout.style.fontSize = '16px';
                usernameElement.appendChild(sprout);
            }

            const tweetCard = tweetElement.closest('article');
            if (tweetCard && !tweetCard.dataset.opOriginalBorder) {
                tweetCard.dataset.opOriginalBorder = tweetCard.style.borderLeft;
                tweetCard.classList.add('op-enhanced');
                tweetCard.style.borderLeft = '1px solid gold';
            }
        } catch (error) {
            console.error('Error enhancing original poster tweet:', error);
        }
    },

    removeOriginalPosterEnhancements: (tweetElement) => {
        try {
            const sprout = tweetElement.querySelector('.op-sprout');
            if (sprout) {
                sprout.remove();
            }

            const tweetCard = tweetElement.closest('article');
            if (tweetCard && tweetCard.dataset.opOriginalBorder !== undefined) {
                tweetCard.style.borderLeft = tweetCard.dataset.opOriginalBorder;
                delete tweetCard.dataset.opOriginalBorder;
                tweetCard.classList.remove('op-enhanced');
            }
        } catch (error) {
            console.error('Error removing original poster enhancements:', error);
        }
    },

    enhanceMutualTweet: async (tweetElement) => {
        const theme = detectTwitterTheme();
        const colors = {
            light: {
                badge: '#794BC4',
                gradient: 'linear-gradient(45deg, rgba(121, 75, 196, 0.08) 0%, rgba(121, 75, 196, 0.12) 100%)',
                hoverGradient: 'linear-gradient(45deg, rgba(121, 75, 196, 0.12) 0%, rgba(121, 75, 196, 0.18) 100%)',              
            },
            dim: {
                badge: '#8A5CD6',
                gradient: 'linear-gradient(45deg, rgba(138, 92, 214, 0.1) 0%, rgba(138, 92, 214, 0.15) 100%)',
                hoverGradient: 'linear-gradient(45deg, rgba(138, 92, 214, 0.15) 0%, rgba(138, 92, 214, 0.2) 100%)',
            },
            dark: {
                badge: '#9B6DEB',
                gradient: 'linear-gradient(45deg, rgba(155, 109, 235, 0.15) 0%, rgba(155, 109, 235, 0.2) 100%)',
                hoverGradient: 'linear-gradient(45deg, rgba(155, 109, 235, 0.2) 0%, rgba(155, 109, 235, 0.25) 100%)'
            }
        };
        return TweetEnhancements.enhanceTweet(
            tweetElement, 
            'MUTUAL', 
            colors[theme].badge,
            colors[theme].gradient,
            colors[theme].hoverGradient
        );
    },

    removeMutualTweetEnhancements: (tweetElement) => {
        return TweetEnhancements.removeTweetEnhancements(tweetElement);
    },

    enhanceFollowerTweet: async (tweetElement) => {
        const theme = detectTwitterTheme();
        const colors = {
            light: {
                badge: '#00BA7C',
                gradient: 'linear-gradient(45deg, rgba(0, 186, 124, 0.08) 0%, rgba(0, 186, 124, 0.12) 100%)',
                hoverGradient: 'linear-gradient(45deg, rgba(0, 186, 124, 0.12) 0%, rgba(0, 186, 124, 0.18) 100%)',              
            },
            dim: {
                badge: '#00CC88',
                gradient: 'linear-gradient(45deg, rgba(0, 204, 136, 0.1) 0%, rgba(0, 204, 136, 0.15) 100%)',
                hoverGradient: 'linear-gradient(45deg, rgba(0, 204, 136, 0.15) 0%, rgba(0, 204, 136, 0.2) 100%)',
            },
            dark: {
                badge: '#00D68F',
                gradient: 'linear-gradient(45deg, rgba(0, 214, 143, 0.15) 0%, rgba(0, 214, 143, 0.2) 100%)',
                hoverGradient: 'linear-gradient(45deg, rgba(0, 214, 143, 0.2) 0%, rgba(0, 214, 143, 0.25) 100%)'
            }
        };
        return TweetEnhancements.enhanceTweet(
            tweetElement, 
            'FOLLOWER',
            colors[theme].badge,
            colors[theme].gradient,
            colors[theme].hoverGradient
        );
    },

    removeFollowerTweetEnhancements: (tweetElement) => {
        return TweetEnhancements.removeTweetEnhancements(tweetElement);
    },

    enhanceFollowingTweet: async (tweetElement) => {
        const theme = detectTwitterTheme();
        const colors = {
            light: {
                badge: '#1D9BF0',
                gradient: 'linear-gradient(45deg, rgba(29, 155, 240, 0.08) 0%, rgba(29, 155, 240, 0.12) 100%)',
                hoverGradient: 'linear-gradient(45deg, rgba(29, 155, 240, 0.12) 0%, rgba(29, 155, 240, 0.18) 100%)',              
            },
            dim: {
                badge: '#1DA1F2',
                gradient: 'linear-gradient(45deg, rgba(29, 161, 242, 0.1) 0%, rgba(29, 161, 242, 0.15) 100%)',
                hoverGradient: 'linear-gradient(45deg, rgba(29, 161, 242, 0.15) 0%, rgba(29, 161, 242, 0.2) 100%)',
            },
            dark: {
                badge: '#1D9BF0',
                gradient: 'linear-gradient(45deg, rgba(29, 155, 240, 0.15) 0%, rgba(29, 155, 240, 0.2) 100%)',
                hoverGradient: 'linear-gradient(45deg, rgba(29, 155, 240, 0.2) 0%, rgba(29, 155, 240, 0.25) 100%)'
            }
        };
        return TweetEnhancements.enhanceTweet(
            tweetElement, 
            'FOLLOWING',
            colors[theme].badge,
            colors[theme].gradient,
            colors[theme].hoverGradient
        );
    },

    removeFollowingTweetEnhancements: (tweetElement) => {
        return TweetEnhancements.removeTweetEnhancements(tweetElement);
    },

    obfuscateUser: async (tweetElement: HTMLElement) => {
        try {
            const avatarContainer = tweetElement.querySelector('[data-testid^="UserAvatar-Container"]');
            const displayNameElement = tweetElement.querySelector('div[data-testid="User-Name"] a[role="link"]') as HTMLAnchorElement;
            const usernameElement = tweetElement.querySelector('div[data-testid="User-Name"] div:not([data-testid]) a[tabindex="-1"] span') as HTMLSpanElement;
            const quotedTweet = tweetElement.querySelector('div[class*="r-eqz5dr"][class*="r-jusfrs"]');
            DevLog("quotedTweet",quotedTweet)
            if(quotedTweet) {
                TweetEnhancements.obfuscateUser(quotedTweet as HTMLElement);
            }
            
            if (!avatarContainer || !usernameElement || !displayNameElement) {
                DevLog('Could not find required elements', { 
                    avatarFound: !!avatarContainer, 
                    usernameFound: !!usernameElement, 
                    displayNameFound: !!displayNameElement 
                });
                return;
            }


            if (tweetElement.classList.contains('obfuscated-user')) return;

            const href = displayNameElement.href;
            const originalUsername = href.split('/').pop() || '';
            const anonymousId = originalUsername.toLowerCase().startsWith('user') ? originalUsername : generateAnonymousId(originalUsername);

            // Store original values
            tweetElement.dataset.originalUsername = usernameElement.textContent;
            tweetElement.dataset.originalDisplayName = displayNameElement.textContent;
            tweetElement.classList.add('obfuscated-user');

            const containerStyle = window.getComputedStyle(avatarContainer);
            const size = parseInt(containerStyle.width) || 40;

            const imageContainer = (
                avatarContainer.querySelector('div > img')?.parentElement || 
                avatarContainer.querySelector('div[style*="background-image"]')
            );

            if (imageContainer) {
                if (!imageContainer.dataset.originalHtml) {
                    imageContainer.dataset.originalHtml = imageContainer.innerHTML;
                }
                const parentElement = imageContainer.parentElement;
                if (parentElement) {
                    parentElement.innerHTML = generateAvatarSVG(anonymousId, size, originalUsername);
                }
            }

            if (usernameElement) {
                usernameElement.textContent = `■■■■■■■■■`;
            }
            displayNameElement.textContent = anonymousId;

        } catch (error) {
            console.error('Error obfuscating user:', error);
        }
    },

    removeObfuscation: (tweetElement: HTMLElement) => {
        try {
            if (!tweetElement.classList.contains('obfuscated-user')) return;

            const displayNameElement = tweetElement.querySelector('div[data-testid="User-Name"] a[role="link"]') as HTMLAnchorElement;
            const usernameElement = tweetElement.querySelector('div[data-testid="User-Name"] span');
            const avatarContainer = tweetElement.querySelector('[data-testid^="UserAvatar-Container"]');

            if (usernameElement && tweetElement.dataset.originalUsername) {
                usernameElement.textContent = tweetElement.dataset.originalUsername;
            }

            if (displayNameElement && tweetElement.dataset.originalDisplayName) {
                displayNameElement.textContent = tweetElement.dataset.originalDisplayName;
            }

            if (avatarContainer) {
                const imageContainer = (
                    avatarContainer.querySelector('div > img')?.parentElement || 
                    avatarContainer.querySelector('div[style*="background-image"]')
                );

                if (imageContainer?.dataset.originalHtml) {
                    imageContainer.innerHTML = imageContainer.dataset.originalHtml;
                    delete imageContainer.dataset.originalHtml;
                }
            }

            // Remove stored data
            delete tweetElement.dataset.originalUsername;
            delete tweetElement.dataset.originalDisplayName;
            tweetElement.classList.remove('obfuscated-user');

        } catch (error) {
            console.error('Error removing obfuscation:', error);
        }
    },

    enhanceSignalBoostingUrls: async (tweetElement: HTMLElement, onSignalBoostClick: () => void) => {
        try {
            const links = tweetElement.querySelectorAll('[data-testid="tweetText"] a[role="link"]') as NodeListOf<HTMLAnchorElement>;
            
            links.forEach(link => {
                if (!(link instanceof HTMLElement)) return;
                
                if (link.href.includes('/hashtag/') || link.href.includes('/status/') || link.href.includes('x.com') || !link.href.includes('http')) return;

                if (link.parentElement?.classList.contains('signal-boost-link-wrapper')) return;

                // Store original parent and next sibling
                const originalParent = link.parentElement;
                const nextSibling = link.nextSibling;
                link.dataset.originalParentId = originalParent?.id || '';
                link.dataset.originalNextSiblingId = nextSibling?.['id'] || '';

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

                const boostIcon = document.createElement('span');
                boostIcon.className = 'signal-boost-icon';
                boostIcon.innerHTML = '📢';
                boostIcon.style.fontSize = '14px';
                boostIcon.style.opacity = '0';
                boostIcon.style.transform = 'scale(0.8)';
                boostIcon.style.transition = 'all 0.2s ease';
                boostIcon.style.cursor = 'pointer';

                link.parentNode?.insertBefore(wrapper, link);
                wrapper.appendChild(boostIcon);
                wrapper.appendChild(link);

                const mouseEnterHandler = () => {
                    wrapper.style.background = 'linear-gradient(45deg, rgba(29, 161, 242, 0.2), rgba(120, 86, 255, 0.2))';
                    wrapper.style.transform = 'translateY(-1px)';
                    boostIcon.style.opacity = '1';
                    boostIcon.style.transform = 'scale(1)';
                };

                const mouseLeaveHandler = () => {
                    wrapper.style.background = 'linear-gradient(45deg, rgba(29, 161, 242, 0.1), rgba(120, 86, 255, 0.1))';
                    wrapper.style.transform = 'translateY(0)';
                    boostIcon.style.opacity = '0';
                    boostIcon.style.transform = 'scale(0.8)';
                };

                wrapper.addEventListener('mouseenter', mouseEnterHandler);
                wrapper.addEventListener('mouseleave', mouseLeaveHandler);

                boostIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onSignalBoostClick) {
                        onSignalBoostClick();
                    }
                });
            });

        } catch (error) {
            console.error('Error enhancing signal boosting URLs:', error);
        }
    },

    removeSignalBoostingUrls: (tweetElement: HTMLElement) => {
        try {
            const wrappers = tweetElement.querySelectorAll('.signal-boost-link-wrapper');
            wrappers.forEach(wrapper => {
                const link = wrapper.querySelector('a[role="link"]');
                if (link && link.dataset.originalParentId) {
                    const originalParent = document.getElementById(link.dataset.originalParentId);
                    const nextSibling = link.dataset.originalNextSiblingId ? 
                        document.getElementById(link.dataset.originalNextSiblingId) : null;

                    if (originalParent) {
                        if (nextSibling) {
                            originalParent.insertBefore(link, nextSibling);
                        } else {
                            originalParent.appendChild(link);
                        }
                    }

                    delete link.dataset.originalParentId;
                    delete link.dataset.originalNextSiblingId;
                }
                wrapper.remove();
            });
        } catch (error) {
            console.error('Error removing signal boosting URLs:', error);
        }
    },

    enhanceHighEngagementTweet: async (tweetElement: HTMLElement) => {
        try {
            if (tweetElement.classList.contains('high-engagement-enhanced')) return;
            tweetElement.classList.add('high-engagement-enhanced');
    
            const tweetCard = tweetElement.querySelectorAll('div[aria-labelledby],div[lang]');
            
            if (!tweetCard) return;
            for (const element of tweetCard) {
                if (!(element instanceof HTMLElement)) continue;

                // Store original styles
                element.dataset.originalStyles = JSON.stringify({
                    transition: element.style.transition,
                    filter: element.style.filter,
                    opacity: element.style.opacity
                });

                element.style.transition = 'all 0.2s ease';
                element.style.filter = 'blur(3px) brightness(0.7)';
                element.style.opacity = '0.5';
    
                const mouseEnterHandler = () => {
                    element.style.filter = 'none';
                    element.style.opacity = '1';
                };
    
                const mouseLeaveHandler = () => {
                    element.style.filter = 'blur(3px) brightness(0.7)';
                    element.style.opacity = '0.5';
                };
    
                element.addEventListener('mouseenter', mouseEnterHandler);
                element.addEventListener('mouseleave', mouseLeaveHandler);

                // Store handlers for removal
                element.dataset.mouseEnterHandler = mouseEnterHandler.toString();
                element.dataset.mouseLeaveHandler = mouseLeaveHandler.toString();
            }
    
        } catch (error) {
            console.error('Error enhancing high engagement tweet:', error);
        }
    },

    removeHighEngagementTweet: (tweetElement: HTMLElement) => {
        try {
            if (!tweetElement.classList.contains('high-engagement-enhanced')) return;
            
            const elements = tweetElement.querySelectorAll('div[aria-labelledby],div[lang]');
            
            elements.forEach(element => {
                if (element instanceof HTMLElement && element.dataset.originalStyles) {
                    // Restore original styles
                    const originalStyles = JSON.parse(element.dataset.originalStyles);
                    Object.assign(element.style, originalStyles);
                    
                    // Remove event listeners
                    if (element.dataset.mouseEnterHandler) {
                        element.removeEventListener('mouseenter', new Function('return ' + element.dataset.mouseEnterHandler)());
                    }
                    if (element.dataset.mouseLeaveHandler) {
                        element.removeEventListener('mouseleave', new Function('return ' + element.dataset.mouseLeaveHandler)());
                    }
                    
                    // Clean up datasets
                    delete element.dataset.originalStyles;
                    delete element.dataset.mouseEnterHandler;
                    delete element.dataset.mouseLeaveHandler;
                }
            });
            
            tweetElement.classList.remove('high-engagement-enhanced');
        } catch (error) {
            console.error('Error removing high engagement tweet enhancements:', error);
        }
    },

    applyTextModifiers: async (tweetElement: HTMLElement) => {
        const textElement = tweetElement.querySelector('[data-testid="tweetText"] span');
        if (!textElement) return;
        if (textElement.classList.contains("tweet-text-modifiers")) return;
        textElement.classList.add("tweet-text-modifiers");
        
        const originalText = textElement.textContent;
        textElement.dataset.originalText = originalText;
        let newText = originalText;
        
        const replacements = await GlobalCachedData.GetTextModifiers() || [];
        if (!replacements || replacements.length == 0) return;
        
        replacements.forEach(replacement => {
            newText = newText.replace(
                new RegExp(replacement.from, 'g'), 
                replacement.to
            );
        });
        
        textElement.textContent = newText;
        
        const mouseEnterHandler = () => {
            textElement.textContent = originalText;
        };
        
        const mouseLeaveHandler = () => {
            textElement.textContent = newText;
        };
        
        textElement.addEventListener('mouseenter', mouseEnterHandler);
        textElement.addEventListener('mouseleave', mouseLeaveHandler);

        // Store handlers for removal
        textElement.dataset.mouseEnterHandler = mouseEnterHandler.toString();
        textElement.dataset.mouseLeaveHandler = mouseLeaveHandler.toString();
    },

    removeTextModifiers: (tweetElement: HTMLElement) => {
        const textElement = tweetElement.querySelector('[data-testid="tweetText"] span.tweet-text-modifiers');
        if (!textElement || !textElement.dataset.originalText) return;
        
        // Remove event listeners
        if (textElement.dataset.mouseEnterHandler) {
            textElement.removeEventListener('mouseenter', new Function('return ' + textElement.dataset.mouseEnterHandler)());
        }
        if (textElement.dataset.mouseLeaveHandler) {
            textElement.removeEventListener('mouseleave', new Function('return ' + textElement.dataset.mouseLeaveHandler)());
        }
        
        textElement.textContent = textElement.dataset.originalText;
        delete textElement.dataset.originalText;
        delete textElement.dataset.mouseEnterHandler;
        delete textElement.dataset.mouseLeaveHandler;
        textElement.classList.remove("tweet-text-modifiers");
    },

    enhanceTweetWithLongTweetText: async (tweetElement: HTMLElement, text: string) => {
        const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]:first-of-type') as HTMLElement;
        const tweetTextSpan = tweetElement.querySelector('[data-testid="tweetText"]:first-of-type span');
        
        if (!tweetTextSpan) return;
        const tweetShowMoreElement = tweetElement.querySelector('[data-testid="tweet-text-show-more-link"]');

        if (tweetShowMoreElement) {
            // Store original styles and content
            tweetTextSpan.dataset.originalText = tweetTextSpan.textContent;
            tweetTextElement.dataset.originalLineClamp = tweetTextElement.style.webkitLineClamp;
            tweetShowMoreElement.dataset.originalDisplay = tweetShowMoreElement.style.display;
            
            tweetShowMoreElement.style.display = 'none';
            tweetTextElement.style.webkitLineClamp = 'none';
            tweetTextSpan.textContent = text;
            tweetElement.classList.add('enhanced-long-tweet');
        }
    },

    removeLongTweetText: (tweetElement: HTMLElement) => {
        const tweetTextSpan = tweetElement.querySelector('[data-testid="tweetText"]:first-of-type span');
        const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]:first-of-type') as HTMLElement;
        const tweetShowMoreElement = tweetElement.querySelector('[data-testid="tweet-text-show-more-link"]');
        
        if (!tweetTextSpan || !tweetTextSpan.dataset.originalText) return;
        
        tweetTextSpan.textContent = tweetTextSpan.dataset.originalText;
        if (tweetTextElement?.dataset.originalLineClamp) {
        delete tweetTextSpan.dataset.originalText;
        tweetTextElement.style.webkitLineClamp = '';
        tweetElement.classList.remove('enhanced-long-tweet');
        }
    },

    enhanceAvatarWithGif: async (tweetElement: HTMLElement) => {
        const avatarImage = tweetElement.querySelector('img[src*="profile_images"][draggable="true"]') as HTMLImageElement;
        
        if (!avatarImage) return;
        
        const gifUrl = "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3FxZDg1dXQ0ZTl3ZzB0aGZnajZnNjhwczU2M2NrZGk5MHVzYWp3aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GbUrFXadBryQ8/giphy.gif";
        avatarImage.dataset.originalSrc = avatarImage.src;
        avatarImage.src = gifUrl;

        avatarImage.parentElement.children[0].style.backgroundImage = `url("${avatarImage.src}")`;
        avatarImage.classList.add('gif-enhanced-avatar');

        const observer = new MutationObserver((mutations) => {
            if (avatarImage.src !== gifUrl) {
                avatarImage.src = gifUrl;
            }
        });
        
        observer.observe(avatarImage, { attributes: true });
        
        setTimeout(() => {
            observer.disconnect();
        }, 5000);
    },

    removeAvatarGif: (tweetElement: HTMLElement) => {
        const avatarImage = tweetElement.querySelector('img.gif-enhanced-avatar') as HTMLImageElement;
        
        if (!avatarImage || !avatarImage.dataset.originalSrc) return;
        
        avatarImage.src = avatarImage.dataset.originalSrc;
        avatarImage.parentElement.children[0].style.backgroundImage = `url("${avatarImage.dataset.originalSrc}")`;
        
        delete avatarImage.dataset.originalSrc;
        avatarImage.classList.remove('gif-enhanced-avatar');
    }
};
