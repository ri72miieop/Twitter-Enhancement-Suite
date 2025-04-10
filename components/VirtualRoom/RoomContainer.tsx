// src/components/RoomContainer.tsx
import React from 'react';
import { FLOOR_PATTERNS } from '~constants/VirtualRoom/room';

interface RoomContainerProps {
  floorPattern: string;
  width: number;
  height: number;
  children: React.ReactNode;
}

export const RoomContainer: React.FC<RoomContainerProps> = ({
  floorPattern,
  width,
  height,
  children
}) => {
  return (
    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
      <div 
        className="relative"
        style={{ 
          width: `${width}px`,
          height: `${height}px`,
          margin: '0 auto'
        }}
      >
        <div
          className={`absolute inset-0 ${FLOOR_PATTERNS[floorPattern] || 'bg-white'}`}
        >
          {/* Background Grid */}
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
          {children}
        </div>
      </div>
    </div>
  );
};