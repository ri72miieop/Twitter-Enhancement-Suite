// src/components/RoomSetup.tsx
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ROOM_TEMPLATES, FURNITURE_OPTIONS, FLOOR_PATTERNS, AVATAR_COLORS } from '~constants/VirtualRoom/room';
import type { RoomTemplate, RoomData, User, FurnitureItem } from '~types/VirtualRoom/room';
import { generateId } from '~utils/VirtualRoom/id';
import { RoomEditor } from '~components/VirtualRoom/RoomEditor';
import { RoomContainer } from './RoomContainer';

interface RoomSetupProps {
  onEnterRoom: (data: RoomData) => void;
}

export const RoomSetup: React.FC<RoomSetupProps> = ({ onEnterRoom }) => {
  // Template and room state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('studio');
  const [roomData, setRoomData] = useState<RoomTemplate>(ROOM_TEMPLATES.studio);
  const [roomName, setRoomName] = useState<string>('My Cool Room');

  // User customization state
  const [userName, setUserName] = useState<string>('');
  const [userColor, setUserColor] = useState<string>(AVATAR_COLORS[0]);

  // Room customization state
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [floorPattern, setFloorPattern] = useState<string>('wooden');

  const handleUpdateRoom = (updatedRoom: RoomTemplate) => {
    setRoomData(updatedRoom);
  };

  const addFurniture = (type: string) => {
    const newFurniture: FurnitureItem = {
      id: generateId(),
      type,
      label: FURNITURE_OPTIONS[type],
      x: roomData.width / 2,
      y: roomData.height / 2
    };
    setFurniture([...furniture, newFurniture]);
  };

  const removeFurniture = (id: string) => {
    setFurniture(furniture.filter(item => item.id !== id));
  };

  const handleEnterRoom = () => {
    if (!userName.trim()) {
      alert('Please enter your name first!');
      return;
    }

    const finalRoomData: RoomData = {
      ...roomData,
      roomName,
      furniture,
      floorPattern,
      user: { name: userName, color: userColor }
    };

    onEnterRoom(finalRoomData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        className="text-2xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full"
        placeholder="Room Name"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Room Template Selection */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-2">Room Template</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROOM_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  className={`p-2 rounded ${
                    selectedTemplate === key 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedTemplate(key);
                    setRoomData(template);
                  }}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-2">Your Profile</h3>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="Enter your name"
            />
            <div className="flex gap-2">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === userColor ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setUserColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Room Design */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-2">Room Design</h3>
            
            {/* Floor Patterns */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Floor Pattern</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(FLOOR_PATTERNS).map(([name, className]) => (
                  <button
                    key={name}
                    className={`p-4 rounded ${className} ${
                      floorPattern === name ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setFloorPattern(name)}
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Furniture */}
            <div>
              <h4 className="font-medium mb-2">Furniture</h4>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(FURNITURE_OPTIONS).map(([emoji, label]) => (
                  <button
                    key={emoji}
                    onClick={() => addFurniture(emoji)}
                    className="p-2 text-2xl bg-gray-100 rounded hover:bg-gray-200"
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Room Preview */}
        <div className="space-y-4">
        <RoomContainer
            floorPattern={floorPattern}
            width={roomData.width}
            height={roomData.height}
        >
            {/* Background Grid */}
            <div 
            className="absolute inset-0" 
            style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}
            />

            {/* Room Editor */}
            <RoomEditor
            template={roomData}
            onUpdateRoom={handleUpdateRoom}
            />

            {/* Furniture Preview */}
            {furniture.map(item => (
            <div
                key={item.id}
                className="absolute cursor-move text-4xl transform -translate-x-1/2 -translate-y-1/2"
                style={{
                left: item.x,
                top: item.y,
                }}
                draggable
                onDragEnd={(e) => {
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setFurniture(furniture.map(f =>
                    f.id === item.id ? { ...f, x, y } : f
                    ));
                }
                }}
            >
                {item.type}
                <button
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-xs"
                onClick={() => removeFurniture(item.id)}
                >
                ×
                </button>
            </div>
            ))}
        </RoomContainer>

        {/* Enter Room Button */}
        <button
            onClick={handleEnterRoom}
            className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
        >
            Enter Room <ChevronRight className="w-4 h-4" />
        </button>
        </div>
      </div>
    </div>
  );
};