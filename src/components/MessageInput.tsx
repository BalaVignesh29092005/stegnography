import React, { useState, useRef, useEffect } from "react";
import { Picker, BaseEmoji } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";
import "./MessageInput.css";

interface MessageInputProps {
  onSend: (data: {
    text?: string;
    imageFile?: File;
    audioUrl?: string;
    otherFile?: File;
  }) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [timer, setTimer] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value);
  const handleSendText = () => {
    if (text.trim()) {
      onSend({ text });
      setText("");
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendText();
    }
  };

  const toggleEmojiPicker = () => setShowEmojiPicker((prev) => !prev);
  const addEmoji = (emoji: BaseEmoji) => setText((prev) => prev + emoji.native);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setIsRecording(true);
      setIsPaused(false);

      mediaRecorder.ondataavailable = (e: BlobEvent) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        if (!isPaused && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioUrl(URL.createObjectURL(audioBlob));
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const pauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setAudioUrl(null);
    setTimer(0);
  };

  const sendAudio = () => {
    if (audioChunksRef.current.length === 0) return;
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const url = URL.createObjectURL(audioBlob);
    onSend({ audioUrl: url });
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setAudioUrl(null);
    setTimer(0);
  };

  const toggleFileMenu = () => setShowFileMenu((prev) => !prev);
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSend({ imageFile: e.target.files[0] });
      e.target.value = "";
      setShowFileMenu(false);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSend({ otherFile: e.target.files[0] });
      e.target.value = "";
      setShowFileMenu(false);
    }
  };

  const formatTime = (t: number) => {
    const min = Math.floor(t / 60).toString().padStart(2, "0");
    const sec = (t % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <div className="message-input-container">
      {showEmojiPicker && (
        <div className="emoji-picker">
          <Picker onSelect={addEmoji} />
        </div>
      )}

      <input type="file" accept="image/*" ref={imageInputRef} style={{ display: "none" }} onChange={handleImageSelect} />
      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} />

      {/* Normal input */}
      {!isRecording && !audioUrl && (
        <>
          <div className="input-left-icons">
            <button className="icon-btn" onClick={toggleFileMenu}>📎</button>
            {showFileMenu && (
              <div className="file-menu">
                <button onClick={() => imageInputRef.current?.click()}>Send Image</button>
                <button onClick={() => fileInputRef.current?.click()}>Send File</button>
              </div>
            )}
            <button className="icon-btn" onClick={toggleEmojiPicker}>😊</button>
          </div>

          <input type="text" placeholder="Type a message" value={text} onChange={handleTextChange} onKeyDown={handleKeyDown} />

          <div className="input-right-icons">
            {text.trim() ? (
              <button className="icon-btn send-btn" onClick={handleSendText}>➡️</button>
            ) : (
              <button className="icon-btn audio-btn" onClick={startRecording}>🎤</button>
            )}
          </div>
        </>
      )}

      {/* Recording UI */}
      {isRecording && (
        <div className="recording-ui">
          <span className="recording-label">Recording: {formatTime(timer)}</span>
          <div className="recording-buttons">
            <button className="icon-btn stop-btn" onClick={pauseResumeRecording}>{isPaused ? "▶️" : "⏸️"}</button>
            <button className="icon-btn cancel-btn" onClick={cancelRecording}>✅</button>
          </div>
        </div>
      )}

      {/* Audio preview */}
      {audioUrl && !isRecording && (
        <div className="audio-preview">
          <audio controls src={audioUrl}></audio>
          <button className="icon-btn send-btn" onClick={() => { onSend({ audioUrl }); setAudioUrl(null); }}>✅</button>
          <button className="icon-btn cancel-btn" onClick={() => setAudioUrl(null)}>❌</button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
