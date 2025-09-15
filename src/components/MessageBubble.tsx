import React from "react";
import "./MessageBubble.css";

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  file?: File;
  fromMe: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const handleDownload = () => {
    if (!message.file) return;
    const url = URL.createObjectURL(message.file);
    const link = document.createElement("a");
    link.href = url;
    link.download = message.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`message-bubble ${message.fromMe ? "from-me" : "from-them"}`}>
      {message.text && <div className="message-text">{message.text}</div>}

      {message.imageUrl && (
        <img src={message.imageUrl} alt="sent" className="message-image" />
      )}

      {message.audioUrl && message.audioUrl !== "" && (
        <audio controls className="message-audio" src={message.audioUrl}></audio>
      )}

      {message.file && (
        <div className="message-file">
          <span className="file-icon">📁</span>
          <span className="file-name">{message.file.name}</span>
          <button className="download-btn" onClick={handleDownload}>
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 3V15M12 15L8 11M12 15L16 11M4 21H20"
      stroke="black"   // changed from "white" to "black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</button>

        </div>
      )}
    </div>
  );
};

export default MessageBubble;
