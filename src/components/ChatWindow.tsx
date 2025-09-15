import React from "react";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import "./ChatWindow.css";

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  file?: File;
  fromMe: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (data: {
    text?: string;
    imageFile?: File;
    audioUrl?: string;
    otherFile?: File;
  }) => void;
  selectedContact: { id: string; name: string } | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  selectedContact,
}) => {
  return (
    <div className="chat-window">
      {/* Contact Header */}
      {selectedContact && (
        <div className="chat-header">
          <div className="contact-avatar">
            {selectedContact.name.charAt(0).toUpperCase()}
          </div>
          <div className="contact-name">{selectedContact.name}</div>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <MessageInput onSend={onSendMessage} />
    </div>
  );
};

export default ChatWindow;
