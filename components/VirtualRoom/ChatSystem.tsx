// src/components/ChatSystem.tsx
import React, { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import type { ChatMessage, User } from '~types/VirtualRoom/room';

interface ChatSystemProps {
  messages: ChatMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  user: User;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  user
}) => {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/90 border-t shadow-lg">
      <div
        ref={chatRef}
        className="max-h-32 overflow-y-auto p-2 space-y-1"
      >
        {messages.map(message => (
          <div
            key={message.id}
            className={`text-sm ${message.user === user.name ? 'text-right' : ''}`}
          >
            <span
              style={{ color: message.color }}
              className="font-bold"
            >
              {message.user}:
            </span>{' '}
            <span className="bg-white/80 px-2 py-1 rounded-lg inline-block">
              {message.text}
            </span>
          </div>
        ))}
      </div>
      <form
        onSubmit={onSendMessage}
        className="flex gap-2 p-2 border-t"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-3 py-2 rounded border"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};