
// import User from "../models/user.model.js";
// import Message from "../models/message.model.js";
// import cloudinary from "../lib/cloudinary.js";
// import { getReceiverSocketId, io } from "../lib/socket.js";
// import { LanguageServiceClient } from "@google-cloud/language";
// import mongoose from "mongoose";

// const languageClient = new LanguageServiceClient();

// async function analyzeMessage(text) {
//   if (!text) return null;
//   const lowerCaseText = text.toLowerCase();
//   const helpKeywords = ["help", "support", "assistance", "question", "issue"];
//   if (helpKeywords.some((keyword) => lowerCaseText.includes(keyword))) {
//     return "HELP";
//   }
//   try {
//     const document = {
//       content: text,
//       type: "PLAIN_TEXT",
//     };
//     const [result] = await languageClient.analyzeSentiment({ document });
//     const score = result.documentSentiment.score;
//     if (score >= 0.2) return "POSITIVE";
//     if (score <= -0.2) return "NEGATIVE";
//     return "NEUTRAL";
//   } catch (error) {
//     console.error("Error analyzing sentiment:", error.message);
//     return null;
//   }
// }

// export const getUsersForSidebar = async (req, res) => {
//   // ... (no changes in this function)
//   try {
//     const loggedInUserId = req.user._id;
//     const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

//     res.status(200).json(filteredUsers);
//   } catch (error) {
//     console.error("Error in getUsersForSidebar: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const getMessages = async (req, res) => {
//   // ... (no changes in this function)
//   try {
//     const { id: userToChatId } = req.params;
//     const myId = req.user._id;

//     const messages = await Message.find({
//       $or: [
//         { senderId: myId, receiverId: userToChatId },
//         { senderId: userToChatId, receiverId: myId },
//       ],
//     });

//     res.status(200).json(messages);
//   } catch (error) {
//     console.log("Error in getMessages controller: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const sendMessage = async (req, res) => {
//   // ... (no changes in this function)
//   try {
//     const { text, image } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     const analysisResult = await analyzeMessage(text);

//     let imageUrl;
//     if (image) {
//       const uploadResponse = await cloudinary.uploader.upload(image);
//       imageUrl = uploadResponse.secure_url;
//     }

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       text,
//       image: imageUrl,
//       sentiment: analysisResult,
//     });

//     await newMessage.save();

//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.log("Error in sendMessage controller: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // --- NEW FUNCTION TO GET SENTIMENT STATISTICS ---
// export const getSentimentStats = async (req, res) => {
//   try {
//     const loggedInUserId = new mongoose.Types.ObjectId(req.user._id);
//     const otherUserId = new mongoose.Types.ObjectId(req.params.id);

//     const stats = await Message.aggregate([
//       // 1. Match all messages between the two users
//       {
//         $match: {
//           $or: [
//             { senderId: loggedInUserId, receiverId: otherUserId },
//             { senderId: otherUserId, receiverId: loggedInUserId },
//           ],
//           sentiment: { $ne: null }, // Only include messages with a sentiment
//         },
//       },
//       // 2. Group by sender and sentiment, and count them
//       {
//         $group: {
//           _id: {
//             senderId: "$senderId",
//             sentiment: "$sentiment",
//           },
//           count: { $sum: 1 },
//         },
//       },
//       // 3. Reshape the data for easier processing
//       {
//         $group: {
//           _id: "$_id.senderId",
//           sentiments: {
//             $push: {
//               k: "$_id.sentiment",
//               v: "$count",
//             },
//           },
//         },
//       },
//       // 4. Convert the array of sentiments into an object
//       {
//         $project: {
//           _id: 0,
//           senderId: "$_id",
//           stats: { $arrayToObject: "$sentiments" },
//         },
//       },
//     ]);

//     // 5. Format the final response
//     const formattedStats = {
//       myStats: stats.find((s) => s.senderId.equals(loggedInUserId))?.stats || {},
//       theirStats: stats.find((s) => s.senderId.equals(otherUserId))?.stats || {},
//     };

//     res.status(200).json(formattedStats);
//   } catch (error) {
//     console.log("Error in getSentimentStats controller: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };


import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { LanguageServiceClient } from "@google-cloud/language";
import mongoose from "mongoose";

const languageClient = new LanguageServiceClient();

async function analyzeMessage(text) {
  if (!text) return null;
  const lowerCaseText = text.toLowerCase();
  const helpKeywords = ["help", "support", "assistance", "question", "issue"];
  if (helpKeywords.some((keyword) => lowerCaseText.includes(keyword))) {
    return "HELP";
  }
  try {
    const document = {
      content: text,
      type: "PLAIN_TEXT",
    };
    const [result] = await languageClient.analyzeSentiment({ document });

    // --- NEW: Log the detected language to the console ---
    console.log(`Detected language: ${result.language}`);

    const score = result.documentSentiment.score;
    if (score >= 0.2) return "POSITIVE";
    if (score <= -0.2) return "NEGATIVE";
    return "NEUTRAL";
  } catch (error) {
    console.error("Error analyzing sentiment:", error.message);
    return null;
  }
}

export const getUsersForSidebar = async (req, res) => {
  // ... (no changes in this function)
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  // ... (no changes in this function)
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  // ... (no changes in this function)
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const analysisResult = await analyzeMessage(text);
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      sentiment: analysisResult,
    });
    await newMessage.save();
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSentimentStats = async (req, res) => {
  // ... (no changes in this function)
  try {
    const loggedInUserId = new mongoose.Types.ObjectId(req.user._id);
    const otherUserId = new mongoose.Types.ObjectId(req.params.id);
    const stats = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: loggedInUserId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: loggedInUserId },
          ],
          sentiment: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            senderId: "$senderId",
            sentiment: "$sentiment",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.senderId",
          sentiments: {
            $push: {
              k: "$_id.sentiment",
              v: "$count",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          senderId: "$_id",
          stats: { $arrayToObject: "$sentiments" },
        },
      },
    ]);
    const formattedStats = {
      myStats: stats.find((s) => s.senderId.equals(loggedInUserId))?.stats || {},
      theirStats: stats.find((s) => s.senderId.equals(otherUserId))?.stats || {},
    };
    res.status(200).json(formattedStats);
  } catch (error) {
    console.log("Error in getSentimentStats controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
