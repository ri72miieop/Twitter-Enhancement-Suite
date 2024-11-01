
// src/hooks/useChat.ts
import { useState } from 'react';
import type { ChatMessage, User } from '~types/VirtualRoom/room';
import { generateId } from '~utils/VirtualRoom/id';

interface UseChatProps {
  user: User;
}

export const useChat = ({ user }: UseChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: generateId(),
      text: newMessage,
      user: user.name,
      color: user.color,
      timestamp: Date.now()
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage
  };
};