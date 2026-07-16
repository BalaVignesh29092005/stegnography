import express, { Request, Response } from "express";
import User from "../models/User";

const router = express.Router();

// Send friend request
router.post("/send", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });

  const fromUserId = req.session.user.id;
  const { toUsername } = req.body;

  const fromUser = await User.findById(fromUserId);
  const toUser = await User.findOne({ username: toUsername });

  if (!fromUser || !toUser) return res.status(404).json({ message: "User not found" });
  if (fromUser.id === toUser.id) return res.status(400).json({ message: "Cannot add yourself" });

  // ✅ Check existing requests or friendship
  if (toUser.friendRequests.includes(fromUser._id)) return res.status(400).json({ message: "Request already sent" });
  if (toUser.friends.includes(fromUser._id)) return res.status(400).json({ message: "Already friends" });

  toUser.friendRequests.push(fromUser._id);
  fromUser.sentRequests.push(toUser._id);

  await toUser.save();
  await fromUser.save();

  res.json({ message: "Friend request sent!" });
});

// Accept friend request
router.post("/accept", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  const { fromUserId } = req.body;
  const userId = req.session.user.id;

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
router.post("/decline", async (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  const { fromUserId } = req.body;
  const userId = req.session.user.id;

  const user = await User.findById(userId);
  const fromUser = await User.findById(fromUserId);
  if (!user || !fromUser) return res.status(404).json({ message: "User not found" });

  user.friendRequests = user.friendRequests.filter((id) => id.toString() !== fromUserId);
  fromUser.sentRequests = fromUser.sentRequests.filter((id) => id.toString() !== userId);

  await user.save();
  await fromUser.save();

  res.json({ message: "Friend request declined" });
});

// Get friends and requests
router.get("/", async (req: Request, res: Response) => {
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

export default router;
