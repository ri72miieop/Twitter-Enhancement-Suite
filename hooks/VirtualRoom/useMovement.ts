// src/hooks/useMovement.ts
import { useState, useEffect } from 'react';
import type { Position, RoomData } from '~types/VirtualRoom/room';
import { checkCollision } from '~utils/VirtualRoom/collisions';

interface UseMovementProps {
  roomData: RoomData | null;
  initialPosition: Position;
  speed?: number;
}

export const useMovement = ({ 
  roomData, 
  initialPosition,
  speed = 10 
}: UseMovementProps) => {
  const [position, setPosition] = useState<Position>(initialPosition);

  const movePlayer = (newPos: Position) => {
    if (!roomData) return;
    
    // Check room boundaries
    if (newPos.x < 0 || newPos.x > roomData.width || 
        newPos.y < 0 || newPos.y > roomData.height) {
      return;
    }

    // Check wall collisions
    if (!checkCollision(newPos, roomData.walls)) {
      setPosition(newPos);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!roomData) return;

      const newPos = { ...position };

      switch (e.key) {
        case 'ArrowUp':
          newPos.y -= speed;
          break;
        case 'ArrowDown':
          newPos.y += speed;
          break;
        case 'ArrowLeft':
          newPos.x -= speed;
          break;
        case 'ArrowRight':
          newPos.x += speed;
          break;
        default:
          return;
      }

      movePlayer(newPos);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, roomData, speed]);

  return { position, setPosition, movePlayer };
};