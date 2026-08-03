import React from "react";
import { decryptSecret, extractSecretFromImage } from "../utils/stego";
import "./MessageBubble.css";

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  hasHiddenSecret?: boolean;
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

  const handleUnlockSecret = async () => {
    if (!message.hasHiddenSecret || !message.imageUrl) return;
    const password = window.prompt("Enter image password to unlock the hidden message:");
    if (!password) return;

    try {
      const hiddenPayload = await extractSecretFromImage(message.imageUrl);
      const secret = await decryptSecret(hiddenPayload, password);
      window.alert(`Hidden message: ${secret}`);
    } catch (error) {
      window.alert("Incorrect password or failed to unlock the hidden message.");
    }
  };

  return (
    <div className={`message-bubble ${message.fromMe ? "from-me" : "from-them"}`}>
      {message.text && <div className="message-text">{message.text}</div>}

      {message.imageUrl && (
        <div className="image-wrapper">
          <img src={message.imageUrl} alt="sent" className="message-image" />
          {message.hasHiddenSecret && (
            <button className="image-overlay-btn" onClick={handleUnlockSecret}>
              🔍
            </button>
          )}
        </div>
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
                stroke="black"
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
