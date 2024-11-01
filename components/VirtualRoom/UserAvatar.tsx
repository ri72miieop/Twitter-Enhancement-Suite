// src/components/UserAvatar.tsx
import React from 'react';
import type { User, Position } from '~types/VirtualRoom/room';

interface UserAvatarProps {
  user: User;
  position: Position;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, position }) => {
  return (
    <div
      className="absolute transition-all duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10
      }}
    >
      <div className="relative">
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: user.color }}
        />
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-current"
          style={{ color: user.color }}
        />
      </div>
      <div className="text-xs text-center mt-3 font-medium bg-white/90 px-2 py-0.5 rounded-full">
        {user.name}
      </div>
    </div>
  );
};