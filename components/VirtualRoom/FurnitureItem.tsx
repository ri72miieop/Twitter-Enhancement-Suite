
// src/components/FurnitureItem.tsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import type { FurnitureItem as FurnitureItemType } from '~types/VirtualRoom/room';

interface FurnitureItemProps {
  item: FurnitureItemType;
  isSelected: boolean;
  onSelect: (item: FurnitureItemType) => void;
  onRemove: (id: string) => void;
}

export const FurnitureItem: React.FC<FurnitureItemProps> = ({
  item,
  isSelected,
  onSelect,
  onRemove
}) => {
  return (
    <div
      className="absolute cursor-move text-4xl"
      style={{
        left: item.x,
        top: item.y,
        transform: 'translate(-50%, -50%)',
        filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.1))'
      }}
      onClick={() => onSelect(item)}
    >
      {item.type}
      {isSelected && (
        <button
          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};