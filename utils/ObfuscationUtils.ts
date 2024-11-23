import React, { type SVGAttributes } from 'react';

// Helper functions for obfuscation
export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
};

export const stringToColorRGB = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate RGB values between 100-200 for pastel colors
  const r = ((hash & 0xFF0000) >> 16) % 100 + 100;
  const g = ((hash & 0x00FF00) >> 8) % 100 + 100;
  const b = (hash & 0x0000FF) % 100 + 100;
  return `rgb(${r}, ${g}, ${b})`;
};

export const generateAnonymousId = (username: string): string => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const digits = Math.abs(hash % 1000000).toString().padStart(6, '0');
  return `anon_${digits}`;
};

export const generateAvatarSVG = (anonymousId: string, size: number = 48, originalUsername: string): string => {
  const primaryColor = stringToColor(anonymousId);
  const hue = parseInt(primaryColor.match(/hsl\((\d+)/)?.[1] || '0');
  const secondaryColor = `hsl(${(hue + 180) % 360}, 70%, 80%)`;
  
  // Get last 2 digits from the anonymousId
  const digits = anonymousId.replace(/\D/g, ''); // Remove all non-digits
  const lastTwoDigits = digits.slice(-2).padStart(2, '0');
  console.log('anonymousId', anonymousId, 'lastTwoDigits', lastTwoDigits, 'originalUsername', originalUsername);
  
  // Generate pattern seed
  const patternSeed = Array.from(anonymousId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Define a richer set of patterns
  const patterns = [
    // Diagonal stripes
    `<path d="M0 0 L${size} ${size} M${-size/4} 0 L${size} ${size*5/4} M${size*3/4} 0 L${size*2} ${size*5/4}" stroke="${secondaryColor}" stroke-width="2"/>`,
    
    // Concentric circles
    `<circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="none" stroke="${secondaryColor}" stroke-width="2"/>
     <circle cx="${size/2}" cy="${size/2}" r="${size/4}" fill="none" stroke="${secondaryColor}" stroke-width="2"/>
     <circle cx="${size/2}" cy="${size/2}" r="${size/6}" fill="${secondaryColor}"/>`,
    
    // Grid pattern
    `<path d="M${size/3} 0 V${size} M${size*2/3} 0 V${size} M0 ${size/3} H${size} M0 ${size*2/3} H${size}" stroke="${secondaryColor}" stroke-width="2"/>`,
    
    // Hexagon
    `<path d="M${size/2} ${size/6} L${size*5/6} ${size/3} L${size*5/6} ${size*2/3} L${size/2} ${size*5/6} L${size/6} ${size*2/3} L${size/6} ${size/3} Z" fill="none" stroke="${secondaryColor}" stroke-width="2"/>`,
    
    // Dotted grid
    `${Array.from({length: 9}, (_, i) => 
      `<circle cx="${size*(1+i%3)/4}" cy="${size*(1+Math.floor(i/3))/4}" r="${size/16}" fill="${secondaryColor}"/>`
    ).join('')}`,
    
    // Waves
    `<path d="M0 ${size/2} C${size/4} ${size/3}, ${size*3/4} ${size*2/3}, ${size} ${size/2}" stroke="${secondaryColor}" stroke-width="2" fill="none"/>
     <path d="M0 ${size*2/3} C${size/4} ${size/2}, ${size*3/4} ${size*5/6}, ${size} ${size*2/3}" stroke="${secondaryColor}" stroke-width="2" fill="none"/>`,
    
    // Crossed diamonds
    `<path d="M${size/2} ${size/6} L${size*5/6} ${size/2} L${size/2} ${size*5/6} L${size/6} ${size/2} Z M${size/2} ${size*5/6} L${size*5/6} ${size/2} L${size/2} ${size/6} L${size/6} ${size/2} Z" stroke="${secondaryColor}" stroke-width="2" fill="none"/>`,
    
    // Radial lines
    `${Array.from({length: 8}, (_, i) => {
      const angle = (i * Math.PI / 4);
      const x2 = size/2 + Math.cos(angle) * size/3;
      const y2 = size/2 + Math.sin(angle) * size/3;
      return `<line x1="${size/2}" y1="${size/2}" x2="${x2}" y2="${y2}" stroke="${secondaryColor}" stroke-width="2"/>`;
    }).join('')}`,
    
    // Checkerboard
    `${Array.from({length: 4}, (_, i) => 
      `<rect x="${size*(i%2)/2}" y="${size*Math.floor(i/2)/2}" width="${size/2}" height="${size/2}" fill="${secondaryColor}" opacity="0.3"/>`
    ).join('')}`,
    
    // Spiral
    `<path d="M${size/2} ${size/2} A${size/4} ${size/4} 0 0 1 ${size*3/4} ${size/2} A${size/6} ${size/6} 0 0 1 ${size/2} ${size*3/4} A${size/8} ${size/8} 0 0 1 ${size/4} ${size/2}" fill="none" stroke="${secondaryColor}" stroke-width="2"/>`
  ];

  const selectedPattern = patterns[patternSeed % patterns.length];
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="border-radius: 50%;">
      <rect width="${size}" height="${size}" fill="${primaryColor}"/>
      ${selectedPattern}
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#4B5563" font-size="${size/3}" font-weight="bold">
        ${lastTwoDigits}
      </text>
    </svg>
  `;
};