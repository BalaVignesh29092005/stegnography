import express, { Request, Response } from "express";
import Message from "../models/Message";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Send message
router.post("/", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });

  const { to, text, imageUrl, audioUrl, fileUrl } = req.body;
  if (!to) return res.status(400).json({ message: "Recipient required" });

  try {
    const message = await Message.createMessage({
      from: req.session.user.id,
      to,
      text,
      imageUrl,
      audioUrl,
      fileUrl,
    });
    res.json({ message });
  } catch (err) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Get messages with a contact
router.get("/:contactId", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });

  const userId = req.session.user.id;
  const contactId = req.params.contactId;

  const messages = await Message.find({
    $or: [
      { from: userId, to: contactId },
      { from: contactId, to: userId },
    ],
  }).sort({ createdAt: 1 });

  res.json({ messages });
});

// Upload file
router.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

export default router;
