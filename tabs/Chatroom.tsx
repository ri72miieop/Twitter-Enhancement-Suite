import React, { useEffect, useState, useRef } from "react";
import { supabase } from "~core/supabase";
import UserInfo from "~components/ui/Chat/UserInfo";
import { Send, Loader2 } from "lucide-react";

const ChatRoom = () => {
  const [messages, setMessages] = useState<any[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const channelId = "1";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("chatroom_message")
        .select("*")
        .eq("chatroom_id", channelId)
        .order("created_at", { ascending: true });
      
      if (error) console.log(JSON.stringify(error));
      setMessages(data);
      setIsLoading(false);
    }

    fetchData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const databaseFilter = {
    schema: "public",
    table: "chatroom_message",
    filter: `chatroom_id=eq.${channelId}`,
    event: "INSERT",
  };

  useEffect(() => {
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", databaseFilter, receivedDatabaseEvent)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [messages]);

  const receivedDatabaseEvent = (event: any) => {
    const newMsg = event.new;
    setMessages(messages ? [...messages, newMsg] : [newMsg]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("message") as HTMLInputElement;
    const message = input.value.trim();

    if (message) {
      setIsSending(true);
      const { error } = await supabase.from("chatroom_message").insert({
        message,
        chatroom_id: channelId,
        user_id: "345709253",
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error(error);
      } else {
        input.value = "";
        inputRef.current?.focus();
      }
      setIsSending(false);
    }
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
           messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {messages?.map((message, index) => {
              const isCurrentUser = message.user_id === "345709253";
              return (
                <div
                  key={message.id || index}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      isCurrentUser
                        ? "bg-blue-500 text-white rounded-t-2xl rounded-bl-2xl"
                        : "bg-white text-gray-800 rounded-t-2xl rounded-br-2xl"
                    } p-4 shadow-sm`}
                  >
                    <div className={`flex items-center gap-2 mb-1 ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}>
                      {!isCurrentUser && <UserInfo userId={message.user_id} />}
                      <span className="text-xs opacity-75">
                        {formatMessageDate(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="border-t bg-white p-4 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              name="message"
              className="flex-1 rounded-full px-6 py-3 border border-gray-200 
                       focus:border-blue-400 focus:ring-2 focus:ring-blue-100 
                       transition-all text-base outline-none"
              placeholder="Type a message..."
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;