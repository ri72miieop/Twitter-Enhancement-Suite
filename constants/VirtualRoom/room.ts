// src/constants/room.ts
import { RoomType, WallType, type RoomTemplate } from '~types/VirtualRoom/room';

export const FURNITURE_OPTIONS: Record<string, string> = {
  '🛋️': 'Couch',
  '🪑': 'Chair',
  '📺': 'TV',
  '🪴': 'Plant',
  '📚': 'Bookshelf',
  '🛏️': 'Bed',
  '🗄️': 'Cabinet',
  '💡': 'Lamp'
};

export const FLOOR_PATTERNS: Record<string, string> = {
    wooden: 'bg-amber-50 dark:bg-amber-900',
    carpet: 'bg-red-50 dark:bg-red-900',
    tile: 'bg-slate-100 dark:bg-slate-800',
    marble: 'bg-white dark:bg-gray-700',
    concrete: 'bg-gray-200 dark:bg-gray-600'
  };

export const ROOM_TEMPLATES: Record<string, RoomTemplate> = {
  studio: {
    type: RoomType.SQUARE,
    width: 400,
    height: 400,
    walls: [
      { id: '1', type: WallType.WALL, x1: 0, y1: 0, x2: 400, y2: 0 },
      { id: '2', type: WallType.WALL, x1: 400, y1: 0, x2: 400, y2: 400 },
      { id: '3', type: WallType.WALL, x1: 400, y1: 400, x2: 0, y2: 400 },
      { id: '4', type: WallType.WALL, x1: 0, y1: 400, x2: 0, y2: 0 },
      { id: '5', type: WallType.DOOR, x1: 200, y1: 400, x2: 250, y2: 400 }
    ]
  },
  loft: {
    type: RoomType.L_SHAPED,
    width: 500,
    height: 400,
    walls: [
      { id: '1', type: WallType.WALL, x1: 0, y1: 0, x2: 300, y2: 0 },
      { id: '2', type: WallType.WALL, x1: 300, y1: 0, x2: 300, y2: 200 },
      { id: '3', type: WallType.WALL, x1: 300, y1: 200, x2: 500, y2: 200 },
      { id: '4', type: WallType.WALL, x1: 500, y1: 200, x2: 500, y2: 400 },
      { id: '5', type: WallType.WALL, x1: 500, y1: 400, x2: 0, y2: 400 },
      { id: '6', type: WallType.WALL, x1: 0, y1: 400, x2: 0, y2: 0 },
      { id: '7', type: WallType.DOOR, x1: 225, y1: 400, x2: 275, y2: 400 }
    ]
  }
};

export const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#95A5A6',
  '#F1C40F',
  '#2ECC71'
];