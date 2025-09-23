import Friend from "../models/friend.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientEmail } = req.body;
    const requesterId = req.user._id;

    // Find the recipient user
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent self-friend requests
    if (recipient._id.equals(requesterId)) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    // Check if friendship already exists
    const existingFriendship = await Friend.findFriendship(
      requesterId,
      recipient._id
    );
    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return res
          .status(400)
          .json({ error: "Already friends with this user" });
      } else if (existingFriendship.status === "pending") {
        return res.status(400).json({ error: "Friend request already sent" });
      }
    }

    // Create friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipient._id,
      status: "pending",
    });

    await friendRequest.save();
    await friendRequest.populate("requester", "fullName email profilePic");

    // Send real-time notification to recipient
    const recipientSocketId = getReceiverSocketId(recipient._id);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("friendRequest", {
        id: friendRequest._id,
        requester: friendRequest.requester,
        message: `${friendRequest.requester.fullName} sent you a friend request`,
      });
    }

    res.status(201).json({
      message: "Friend request sent successfully",
      friendRequest: {
        id: friendRequest._id,
        requester: friendRequest.requester,
        recipient: recipient,
      },
    });
  } catch (error) {
    console.log("Error in sendFriendRequest controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId).populate(
      "requester recipient",
      "fullName email profilePic"
    );

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    // Verify the user is the recipient
    if (!friendRequest.recipient._id.equals(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to accept this request" });
    }

    // Update status to accepted
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Send real-time notification to requester
    const requesterSocketId = getReceiverSocketId(friendRequest.requester._id);
    if (requesterSocketId) {
      io.to(requesterSocketId).emit("friendRequestAccepted", {
        friend: friendRequest.recipient,
        message: `${friendRequest.recipient.fullName} accepted your friend request`,
      });
    }

    res.status(200).json({
      message: "Friend request accepted",
      friendship: friendRequest,
    });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Decline friend request
export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const friendRequest = await Friend.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    // Verify the user is the recipient
    if (!friendRequest.recipient.equals(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to decline this request" });
    }

    // Remove the friend request
    await Friend.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Friend request declined" });
  } catch (error) {
    console.log("Error in declineFriendRequest controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.getFriends(userId);

    // Extract friend details (the other user in each friendship)
    const friends = friendships.map((friendship) => {
      if (friendship.requester._id.equals(userId)) {
        return friendship.recipient;
      } else {
        return friendship.requester;
      }
    });

    res.status(200).json(friends);
  } catch (error) {
    console.log("Error in getFriends controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pending friend requests
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const pendingRequests = await Friend.getPendingRequests(userId);

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.log("Error in getPendingRequests controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Search users to add as friends
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Search users by email or full name
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Exclude current user
        {
          $or: [
            { email: { $regex: query, $options: "i" } },
            { fullName: { $regex: query, $options: "i" } },
          ],
        },
      ],
    })
      .select("fullName email profilePic")
      .limit(10);

    // For each user, check friendship status
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await Friend.findFriendship(userId, user._id);
        return {
          ...user.toObject(),
          friendshipStatus: friendship ? friendship.status : "none",
        };
      })
    );

    res.status(200).json(usersWithStatus);
  } catch (error) {
    console.log("Error in searchUsers controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Find and remove the friendship
    const friendship = await Friend.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId, status: "accepted" },
        { requester: friendId, recipient: userId, status: "accepted" },
      ],
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friendship not found" });
    }

    // Send real-time notification to the removed friend
    const friendSocketId = getReceiverSocketId(friendId);
    if (friendSocketId) {
      io.to(friendSocketId).emit("friendRemoved", {
        removedBy: userId,
        message: "A friend has removed you from their friend list",
      });
    }

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.log("Error in removeFriend controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
