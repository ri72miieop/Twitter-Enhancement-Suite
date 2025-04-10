export type TwitterTheme = 'dark' | 'dim' | 'light';

export const detectTwitterTheme = (): TwitterTheme => {
  // Twitter applies specific background colors to the body
  // We can check computed styles to determine the theme
  const backgroundColor = window.getComputedStyle(document.body).backgroundColor;
  
  // Convert RGB to hex for easier comparison
  const rgbToHex = (rgb: string): string => {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return '';
    
    const [_, r, g, b] = match;
    return `#${[r, g, b].map(x => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  };

  const bgHex = rgbToHex(backgroundColor).toLowerCase();

  // These color values might need adjustment based on Twitter's exact colors
  switch (bgHex) {
    case '#000000': // Dark mode
      return 'dark';
    case '#15202b': // Dim mode
      return 'dim';
    default: // Light mode or fallback
      return 'light';
  }
};

// React hook for theme detection
import { useState, useEffect } from 'react';

export const useTwitterTheme = () => {
  const [theme, setTheme] = useState<TwitterTheme>(detectTwitterTheme());

  useEffect(() => {
    // Create a MutationObserver to watch for class/style changes
    const observer = new MutationObserver(() => {
      const newTheme = detectTwitterTheme();
      if (newTheme !== theme) {
        setTheme(newTheme);
      }
    });
    
    // Observe the body element for attribute and class changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Initial check
    setTheme(detectTwitterTheme());

    return () => observer.disconnect();
  }, [theme]);

  return theme;
};

// Usage example:
/*
import { useTwitterTheme } from './themeDetector';

const YourComponent = () => {
  const theme = useTwitterTheme();
  
  return (
    <div className={`my-component theme-${theme}`}>
      Current theme: {theme}
    </div>
  );
};
*/