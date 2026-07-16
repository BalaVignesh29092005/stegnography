import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import expressSession from "express-session";
import MongoStore from "connect-mongo";
import multer from "multer";
import path from "path";
import User from "./models/User";
import Message from "./models/Message";

dotenv.config();
const app = express();

// -------------------- Middleware --------------------
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------- Session --------------------
const MONGO_URI = process.env.MONGO_URI || "";
const SESSION_SECRET = process.env.JWT_SECRET || "default_secret";

declare module "express-session" {
  interface SessionData {
    user?: { id: string; username: string; firstName: string };
  }
}

app.use(
  expressSession({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { httpOnly: true, secure: false, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

// -------------------- MongoDB --------------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// -------------------- Multer --------------------
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// -------------------- Auth Routes --------------------

// Signup
app.post("/signup", async (req: Request, res: Response) => {
  try {
    const { firstName, username, password } = req.body;
    if (!firstName || !username || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username already exists" });

    const user = new User({ firstName, username, password });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Login
app.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    req.session.user = { id: user.id, firstName: user.firstName, username: user.username };
    res.json({ message: "Login successful", user: req.session.user });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Logout
app.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user
app.get("/me", (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  res.json({ user: req.session.user });
});

// -------------------- Friend Routes --------------------

// Send friend request
app.post("/friends/send", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  const fromUserId = req.session.user.id;
  const { toUsername } = req.body;

  const fromUser = await User.findById(fromUserId);
  const toUser = await User.findOne({ username: toUsername });

  if (!fromUser) return res.status(404).json({ message: "Sender not found" });
  if (!toUser) return res.status(404).json({ message: "Recipient not found" });
  if (toUser.id === fromUser.id) return res.status(400).json({ message: "Cannot add yourself" });

  // Check existing request
  if (toUser.friendRequests.includes(fromUser._id))
    return res.status(400).json({ message: "Request already sent" });

  if (toUser.friends.includes(fromUser._id))
    return res.status(400).json({ message: "Already friends" });

  toUser.friendRequests.push(fromUser._id);
  fromUser.sentRequests.push(toUser._id);

  await toUser.save();
  await fromUser.save();

  res.json({ message: "Friend request sent!" });
});

// Accept friend request
app.post("/friends/accept", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  const userId = req.session.user.id;
  const { fromUserId } = req.body;

  const user = await User.findById(userId);
  const fromUser = await User.findById(fromUserId);
  if (!user || !fromUser) return res.status(404).json({ message: "User not found" });

  user.friendRequests = user.friendRequests.filter((id) => id.toString() !== fromUserId);
  fromUser.sentRequests = fromUser.sentRequests.filter((id) => id.toString() !== userId);

  user.friends.push(fromUser._id);
  fromUser.friends.push(user._id);

  await user.save();
  await fromUser.save();

  res.json({ message: "Friend request accepted!" });
});

// Decline friend request
app.post("/friends/decline", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  const userId = req.session.user.id;
  const { fromUserId } = req.body;

  const user = await User.findById(userId);
  const fromUser = await User.findById(fromUserId);
  if (!user || !fromUser) return res.status(404).json({ message: "User not found" });

  user.friendRequests = user.friendRequests.filter((id) => id.toString() !== fromUserId);
  fromUser.sentRequests = fromUser.sentRequests.filter((id) => id.toString() !== userId);

  await user.save();
  await fromUser.save();

  res.json({ message: "Friend request declined" });
});

// Get all friends and requests for current user
app.get("/friends", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });

  const user = await User.findById(req.session.user.id)
    .populate("friends", "id firstName username")
    .populate("friendRequests", "id firstName username")
    .populate("sentRequests", "id firstName username");

  res.json({
    friends: user?.friends || [],
    friendRequests: user?.friendRequests || [],
    sentRequests: user?.sentRequests || [],
  });
});

// -------------------- Message Routes --------------------

// Send message
app.post("/messages", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  try {
    const { to, text, imageUrl, audioUrl, fileUrl } = req.body;
    if (!to) return res.status(400).json({ message: "Recipient required" });

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
app.get("/messages/:contactId", async (req: Request, res: Response) => {
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
app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
