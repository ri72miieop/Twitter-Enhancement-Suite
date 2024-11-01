// src/components/VirtualRoom.tsx
import React, { useState, useEffect } from 'react';
import type { RoomData, Position, ChatMessage } from '~types/VirtualRoom/room';
import { checkCollision } from '~utils/VirtualRoom/collisions';
import { WallRenderer } from './WallRenderer';
import { FurnitureItem } from './FurnitureItem';
import { ChatSystem } from './ChatSystem';
import { UserAvatar } from './UserAvatar';
import { RoomSetup } from './RoomSetup';
import { FLOOR_PATTERNS } from '~constants/VirtualRoom/room';
import { generateId } from '~utils/VirtualRoom/id';

export const VirtualRoom: React.FC = () => {
  const [setup, setSetup] = useState<boolean>(true);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [position, setPosition] = useState<Position>({ x: 50, y: 50 });
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);

  const handleEnterRoom = (data: RoomData) => {
    setRoomData(data);
    setSetup(false);
  };

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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (setup || !roomData) return;

    const speed = 10;
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

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, setup, roomData]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomData) return;

    const message: ChatMessage = {
      id: generateId(),
      text: newMessage,
      user: roomData.user.name,
      color: roomData.user.color,
      timestamp: Date.now()
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  if (setup) {
    return <RoomSetup onEnterRoom={handleEnterRoom} />;
  }

  if (!roomData) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold">{roomData.roomName}</h2>
        </div>

        <div className="relative">
          <div
            className={`relative overflow-hidden ${FLOOR_PATTERNS[roomData.floorPattern]}`}
            style={{
              width: roomData.width,
              height: roomData.height
            }}
          >
            {/* Background Grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(#00000005 1px, transparent 1px), linear-gradient(90deg, #00000005 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* Walls */}
            <WallRenderer walls={roomData.walls} />

            {/* Furniture */}
            {roomData.furniture.map(item => (
              <FurnitureItem
                key={item.id}
                item={item}
                isSelected={selectedFurniture === item.id}
                onSelect={() => setSelectedFurniture(item.id)}
                onRemove={(id) => {
                  setRoomData({
                    ...roomData,
                    furniture: roomData.furniture.filter(f => f.id !== id)
                  });
                  setSelectedFurniture(null);
                }}
              />
            ))}

            {/* User Avatar */}
            <UserAvatar
              user={roomData.user}
              position={position}
            />

            {/* Chat System */}
            <ChatSystem
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSendMessage={handleSendMessage}
              user={roomData.user}
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>Use arrow keys to move around</div>
            <div>Press Enter to focus chat</div>
          </div>
        </div>
      </div>
    </div>
  );
};
