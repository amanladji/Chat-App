// import User from "../models/user.model.js";
// import Message from "../models/message.model.js";
// import cloudinary from "../lib/cloudinary.js";
// import { getReceiverSocketId, io } from "../lib/socket.js";
// // Import the Google Cloud Language service client
// import { LanguageServiceClient } from "@google-cloud/language";

// // Instantiate the client
// const languageClient = new LanguageServiceClient();

// async function analyzeSentiment(text) {
//   if (!text) return null;

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
//     // Return null if API call fails, so message can still be sent
//     return null;
//   }
// }

// export const getUsersForSidebar = async (req, res) => {
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
//   try {
//     const { text, image } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     // --- Start of new logic ---
//     // 1. Analyze sentiment of the text
//     const sentiment = await analyzeSentiment(text);
//     // --- End of new logic ---

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
//       sentiment: sentiment, // 2. Add sentiment to the new message object
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


import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { LanguageServiceClient } from "@google-cloud/language";

const languageClient = new LanguageServiceClient();

// Updated analysis function
async function analyzeMessage(text) {
  if (!text) return null;

  // 1. Check for keywords to detect intent first
  const lowerCaseText = text.toLowerCase();
  const helpKeywords = ["help", "support", "assistance", "question", "issue"];

  if (helpKeywords.some(keyword => lowerCaseText.includes(keyword))) {
    return "HELP";
  }

  // 2. If no intent keyword is found, perform sentiment analysis
  try {
    const document = {
      content: text,
      type: "PLAIN_TEXT",
    };
    const [result] = await languageClient.analyzeSentiment({ document });
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