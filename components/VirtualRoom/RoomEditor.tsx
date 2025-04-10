
// src/components/RoomEditor.tsx
import React, { useState } from 'react';
import { WallType, type RoomTemplate, type Wall } from '~types/VirtualRoom/room';
import { generateId } from '~utils/VirtualRoom/id';
import type { Position } from '~types/VirtualRoom/room';

interface RoomEditorProps {
  template: RoomTemplate;
  onUpdateRoom: (room: RoomTemplate) => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({ template, onUpdateRoom }) => {
  const [mode, setMode] = useState<'view' | 'addWall' | 'addDoor' | 'addWindow'>('view');
  const [startPoint, setStartPoint] = useState<Position | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'view') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!startPoint) {
      setStartPoint({ x, y });
    } else {
      const newWall: Wall = {
        id: generateId(),
        type: mode === 'addDoor' ? WallType.DOOR : 
              mode === 'addWindow' ? WallType.WINDOW : 
              WallType.WALL,
        x1: startPoint.x,
        y1: startPoint.y,
        x2: x,
        y2: y
      };

      onUpdateRoom({
        ...template,
        walls: [...template.walls, newWall]
      });

      setStartPoint(null);
      setMode('view');
    }
  };

  return (
    <div 
      className="relative w-full h-full"
      onClick={handleClick}
    >
      <div className="absolute top-4 left-4 space-x-2 z-10">
        <button
          className={`px-3 py-1 rounded ${mode === 'addWall' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={(e) => {
            e.stopPropagation();
            setMode(mode === 'addWall' ? 'view' : 'addWall');
            setStartPoint(null);
          }}
        >
          Add Wall
        </button>
        <button
          className={`px-3 py-1 rounded ${mode === 'addDoor' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={(e) => {
            e.stopPropagation();
            setMode(mode === 'addDoor' ? 'view' : 'addDoor');
            setStartPoint(null);
          }}
        >
          Add Door
        </button>
        <button
          className={`px-3 py-1 rounded ${mode === 'addWindow' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={(e) => {
            e.stopPropagation();
            setMode(mode === 'addWindow' ? 'view' : 'addWindow');
            setStartPoint(null);
          }}
        >
          Add Window
        </button>
      </div>

      {startPoint && (
        <div
          className="absolute w-2 h-2 bg-blue-500 rounded-full"
          style={{
            left: startPoint.x - 4,
            top: startPoint.y - 4
          }}
        />
      )}
    </div>
  );
};