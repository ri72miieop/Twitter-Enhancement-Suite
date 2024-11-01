// src/types/room.ts
export enum WallType {
    WALL = 'WALL',
    DOOR = 'DOOR',
    WINDOW = 'WINDOW'
  }
  
  export enum RoomType {
    SQUARE = 'SQUARE',
    L_SHAPED = 'L_SHAPED',
    RECTANGULAR = 'RECTANGULAR'
  }
  
  export interface Position {
    x: number;
    y: number;
  }
  
  export interface Wall {
    id: string;
    type: WallType;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  
  export interface FurnitureItem {
    id: string;
    type: string;
    label: string;
    x: number;
    y: number;
  }
  
  export interface User {
    name: string;
    color: string;
  }
  
  export interface ChatMessage {
    id: string;
    text: string;
    user: string;
    color: string;
    timestamp: number;
  }
  
  export interface RoomTemplate {
    type: RoomType;
    width: number;
    height: number;
    walls: Wall[];
  }
  
  export interface RoomData extends RoomTemplate {
    roomName: string;
    furniture: FurnitureItem[];
    floorPattern: string;
    user: User;
  }