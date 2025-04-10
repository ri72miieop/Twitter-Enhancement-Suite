// src/utils/collision.ts

import { WallType, type Position, type Wall } from "~types/VirtualRoom/room";


export const checkCollision = (
  position: Position,
  walls: Wall[],
  padding: number = 10
): boolean => {
  for (const wall of walls) {
    if (wall.type === WallType.DOOR) continue;

    const A = position.x - wall.x1;
    const B = position.y - wall.y1;
    const C = wall.x2 - wall.x1;
    const D = wall.y2 - wall.y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0) param = dot / len_sq;

    let xx: number;
    let yy: number;

    if (param < 0) {
      xx = wall.x1;
      yy = wall.y1;
    } else if (param > 1) {
      xx = wall.x2;
      yy = wall.y2;
    } else {
      xx = wall.x1 + param * C;
      yy = wall.y1 + param * D;
    }

    const dx = position.x - xx;
    const dy = position.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < padding) {
      return true;
    }
  }
  return false;
};

// src/utils/id.ts
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};