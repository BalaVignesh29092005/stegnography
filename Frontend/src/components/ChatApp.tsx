import React, { useState } from "react";
import ContactList from "./ContactList";
import ChatWindow from "./ChatWindow";

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  hasHiddenSecret?: boolean;
  audioUrl?: string;
  file?: File;
  fromMe: boolean;
}

interface Contact {
  id: string;
  name: string;
}

interface User {
  id: string;
  firstName: string;
  username: string;
}

interface ChatAppProps {
  user: User;
}

function ChatApp({ user }: ChatAppProps) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "1": [],
    "2": [],
  });

  const initialContacts: Contact[] = [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
  ];

  const handleSelectContact = (id: string) => setSelectedContactId(id);

  const handleSendMessage = (data: {
    text?: string;
    imageFile?: File;
    hasHiddenSecret?: boolean;
    audioUrl?: string;
    otherFile?: File;
  }) => {
    if (!selectedContactId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      fromMe: true,
    };

    if (data.text) newMessage.text = data.text;
    if (data.imageFile) newMessage.imageUrl = URL.createObjectURL(data.imageFile);
    if (data.hasHiddenSecret) newMessage.hasHiddenSecret = data.hasHiddenSecret;
    if (data.audioUrl) newMessage.audioUrl = data.audioUrl;
    if (data.otherFile) newMessage.file = data.otherFile;

    setMessages((prev) => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), newMessage],
    }));
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f2f5" }}>
      <ContactList
  currentUser={{ id: user.id, name: user.firstName }}
  contacts={initialContacts}
  onSelect={handleSelectContact}
  selectedId={selectedContactId}
  onSignOut={() => {
    window.location.reload(); 
  }}
/>


      {selectedContactId ? (
        <ChatWindow
          messages={messages[selectedContactId] || []}
          onSendMessage={handleSendMessage}
          selectedContact={initialContacts.find((c) => c.id === selectedContactId) || null}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            fontSize: "18px",
            color: "#555",
          }}
        >
          Select a contact to start chatting
        </div>
      )}
    </div>
  );
}

export default ChatApp;
