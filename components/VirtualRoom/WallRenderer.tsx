// src/components/WallRenderer.tsx
import React from 'react';
import type { Wall } from '~types/VirtualRoom/room';
import { WallType } from '~types/VirtualRoom/room';
interface WallRendererProps {
  walls: Wall[];
}

export const WallRenderer: React.FC<WallRendererProps> = ({ walls }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <pattern id="doorPattern" patternUnits="userSpaceOnUse" width="10" height="10">
          <path d="M0,5 L10,5" stroke="#4A5568" strokeWidth="2" fill="none"/>
        </pattern>
      </defs>
      {walls.map((wall) => {
        let strokeProps;
        switch (wall.type) {
          case WallType.DOOR:
            strokeProps = {
              stroke: 'url(#doorPattern)',
              strokeWidth: 6
            };
            break;
          case WallType.WINDOW:
            strokeProps = {
              stroke: '#90CDF4',
              strokeWidth: 6,
              strokeDasharray: '15,10'
            };
            break;
          default:
            strokeProps = {
              stroke: '#1A202C',
              strokeWidth: 6
            };
        }

        return (
          <line
            key={wall.id}
            x1={wall.x1}
            y1={wall.y1}
            x2={wall.x2}
            y2={wall.y2}
            {...strokeProps}
          />
        );
      })}
    </svg>
  );
};