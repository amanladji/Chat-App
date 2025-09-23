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
import { Translate } from "@google-cloud/translate/build/src/v2/index.js";
import mongoose from "mongoose";

const languageClient = new LanguageServiceClient();
const translate = new Translate();

// Function to normalize diacritical marks for better detection
function normalizeDiacritics(text) {
  const diacriticalMap = {
    // Kannada romanization normalizations
    ā: "a",
    ē: "e",
    ī: "i",
    ō: "o",
    ū: "u",
    Ā: "A",
    Ē: "E",
    Ī: "I",
    Ō: "O",
    Ū: "U",
    // Hindi romanization normalizations
    ṃ: "m",
    ṅ: "n",
    ñ: "n",
    ṭ: "t",
    ḍ: "d",
    ṇ: "n",
    ś: "s",
    ṣ: "s",
    ḥ: "h",
  };

  let normalized = text;
  for (const [diacritic, normal] of Object.entries(diacriticalMap)) {
    normalized = normalized.replace(new RegExp(diacritic, "g"), normal);
  }
  return normalized;
}

// Enhanced function to detect transliterated Indic languages
function hasIndicTransliterationPatterns(text) {
  const kannada_patterns = [
    /\b(nanu|nanage|tumba|hegidira|chenagi|khushi|kopa|bekku|madi|idde|alli|illi|yava|yaake)\b/i,
    /\b(bandide|bandilla|hodide|banni|baro|namaskara|dhanyavada|sakagide)\b/i,
    // With diacriticals
    /\b(nānu|nanage|tumbā|kōpa|khūshi|bēku|mādi|iddēne|alliddēne|sākāgide)\b/i,
    // Common Kannada transliteration patterns
    /\b(kopadalli|kopadalliddene|khushialli|santoshavagi|sakagide)\b/i,
  ];

  const hindi_patterns = [
    /\b(kya|kaise|kahan|kyun|accha|theek|bohot|bahut|hoon|tum|aap)\b/i,
    /\b(samaj|dekh|sun|bol|kar|hai|nahin|nahi|maloom|pata)\b/i,
  ];

  return [...kannada_patterns, ...hindi_patterns].some((pattern) =>
    pattern.test(text)
  );
}

// Function to preprocess Kannada transliteration for better translation
function preprocessKannadaTransliteration(text) {
  const kannadaMappings = {
    // Common problematic Kannada transliterations
    kopadalliddene: "very angry I am",
    kopadalli: "angry",
    khushialli: "happy",
    santoshavagi: "happily",
    "nanu tumba kopa": "I am very angry",
    "nanu tumba khushi": "I am very happy",
    "nanu chenagi": "I am fine",
    "nanage sakagide": "it is enough for me",
    "nanage sākāgide": "it is enough for me",
    sakagide: "enough",
    sākāgide: "enough",
    hegidira: "how are you",
    hegiddira: "how are you",
    namaskara: "hello",
    dhanyavada: "thank you",
    "chenagi ide": "it is good",
    "tumba chenagi": "very good",
    "tumba khushi": "very happy",
    "tumba kopa": "very angry",
  };

  let processedText = text.toLowerCase();

  // Check for exact matches first
  for (const [kannada, english] of Object.entries(kannadaMappings)) {
    if (processedText.includes(kannada.toLowerCase())) {
      console.log(`Found Kannada mapping: "${kannada}" -> "${english}"`);
      return english;
    }
  }

  // If no exact match, try word-level replacements
  const wordMappings = {
    nanu: "I",
    nanage: "for me",
    tumba: "very",
    kopa: "angry",
    khushi: "happy",
    chenagi: "fine",
    idde: "am",
    iddene: "am",
    ide: "is",
    sakagide: "enough",
    sākāgide: "enough",
    kopadalliddene: "am very angry",
    hegidira: "how are you",
    banni: "come",
    baro: "come",
    madi: "do",
    bekku: "need",
    namaskara: "hello",
    dhanyavada: "thank you",
  };

  let hasKannadaWords = false;
  for (const [kannada, english] of Object.entries(wordMappings)) {
    if (processedText.includes(kannada)) {
      processedText = processedText.replace(
        new RegExp(`\\b${kannada}\\b`, "gi"),
        english
      );
      hasKannadaWords = true;
    }
  }

  if (hasKannadaWords) {
    console.log(`Preprocessed Kannada: "${text}" -> "${processedText}"`);
    return processedText;
  }

  return text; // Return original if no Kannada words found
}

// Function to analyze contextual sentiment patterns
function analyzeContextualSentiment(text) {
  const lowerText = text.toLowerCase();

  // Patterns that should be POSITIVE despite containing negative words
  const positiveContextPatterns = [
    // Advice/Care patterns
    /\b(don't be|dont be|stop being|avoid being)\s+(angry|sad|upset|mad|frustrated|worried|stressed)\b/i,
    /\b(no need to be|no need to)\s+(angry|sad|upset|worried|stressed)\b/i,
    /\b(try not to be|try not to)\s+(angry|sad|upset|worried|stressed)\b/i,

    // Encouragement patterns
    /\b(hope you're not|hope you are not|hope ur not)\s+(angry|sad|upset|worried|stressed)\b/i,
    /\b(don't worry|dont worry|no worries|don't stress|dont stress)\b/i,
    /\b(cheer up|stay positive|be happy|be strong|take care)\b/i,

    // Negation of negative emotions
    /\b(not (angry|sad|upset|mad|frustrated|worried|stressed))\b/i,
    /\b(no longer (angry|sad|upset|mad|frustrated|worried|stressed))\b/i,

    // Support patterns
    /\b(i understand you're (angry|sad|upset)|i know you're (angry|sad|upset))\b/i,
    /\b(it's okay to be (angry|sad|upset)|its okay to be (angry|sad|upset))\b/i,
  ];

  // Patterns that should be NEUTRAL (questions/concerns) despite containing negative words
  const neutralContextPatterns = [
    // Basic casual questions
    /\b(what are you doing|what r u doing|what ru doing|whatcha doing|wat u doing)\b/i,
    /\b(where are you|where r u|where ru)\b/i,
    /\b(how are you|how r u|how ru|how u doing|sup|wassup)\b/i,
    /\b(what's up|whats up|what up|wats up)\b/i,
    /\b(when are you|when r u|when ru)\b/i,
    /\b(who are you|who r u|who ru)\b/i,

    // Question patterns about emotions
    /\b(why are you|why r u|why ru)\s+(getting|being|so)\s+(angry|mad|upset|frustrated|sad|worried|stressed)\b/i,
    /\b(what's wrong|whats wrong|what happened|what's the matter|whats the matter)\b/i,
    /\b(are you (okay|ok|alright|fine)|r u (okay|ok|alright|fine))\b/i,
    /\b(is everything (okay|ok|alright|fine))\b/i,
    /\b(how are you (feeling|doing)|how r u (feeling|doing))\b/i,

    // Concerned inquiry patterns
    /\b(you seem (angry|upset|sad|frustrated|worried|stressed))\b/i,
    /\b(you look (angry|upset|sad|frustrated|worried|stressed))\b/i,
    /\b(are you (angry|upset|sad|frustrated|worried|stressed))\b/i,
    /\b(why (so|this) (angry|upset|sad|frustrated|worried|stressed))\b/i,

    // Observation patterns
    /\b(i see you're|i can see you're|looks like you're)\s+(angry|upset|sad|frustrated|worried|stressed)\b/i,
    /\b(seems like you're|it seems you're)\s+(angry|upset|sad|frustrated|worried|stressed)\b/i,
  ];

  // Patterns that should be NEGATIVE despite containing positive words
  const negativeContextPatterns = [
    // Sarcasm patterns
    /\b(yeah right|oh sure|very funny|how wonderful|so great)\b.*\b(not|obviously|clearly)\b/i,
    /\b(pretend to be|fake being|acting)\s+(happy|fine|okay|good)\b/i,

    // Frustrated questions
    /\b(why should i be|why would i be)\s+(happy|excited|glad|pleased)\b/i,
    /\b(how can i be|how am i supposed to be)\s+(happy|excited|glad|pleased)\b/i,

    // Kannada negative patterns (transliterated)
    /\b(istavilla|istapadaddu|beda|beku illa|kodabedi)\b/i,
    /\b(mukha nodalu.*istavilla|face.*don't like|face.*hate)\b/i,
    /\b(nanage beda|nange beda|I don't want|don't want)\b/i,

    // Hindi negative patterns (transliterated)
    /\b(pasand nahi|accha nahi|bura lag raha|gussa aa raha)\b/i,
    /\b(nahi chahiye|mat karo|band karo|chup raho)\b/i,

    // Mixed language negative patterns
    /\b(don't like.*face|hate.*face|can't stand)\b/i,
    /\b(go away|get lost|leave me alone|shut up)\b/i,
  ];

  // Check neutral context patterns first (questions/concerns)
  for (const pattern of neutralContextPatterns) {
    if (pattern.test(lowerText)) {
      console.log(
        `Neutral context detected: "${text}" - Pattern: ${pattern.source}`
      );
      return "NEUTRAL";
    }
  }

  // Check positive context patterns
  for (const pattern of positiveContextPatterns) {
    if (pattern.test(lowerText)) {
      console.log(
        `Positive context detected: "${text}" - Pattern: ${pattern.source}`
      );
      return "POSITIVE";
    }
  }

  // Check negative context patterns
  for (const pattern of negativeContextPatterns) {
    if (pattern.test(lowerText)) {
      console.log(
        `Negative context detected: "${text}" - Pattern: ${pattern.source}`
      );
      return "NEGATIVE";
    }
  }

  return null; // No contextual override found
}

async function analyzeMessage(text) {
  if (!text) return null;

  let textToAnalyze = text;

  try {
    // Step 1: Detect the language of the input text
    const [detection] = await translate.detect(text);
    const detectedLanguage = detection.language;

    // Step 1.5: Check for transliterated Indic language patterns
    const hasIndicPatterns = hasIndicTransliterationPatterns(text);
    const normalizedText = normalizeDiacritics(text);

    console.log(`Detected language: ${detectedLanguage} for text: "${text}"`);
    if (hasIndicPatterns) {
      console.log(`Indic transliteration patterns detected in: "${text}"`);
    }
    if (normalizedText !== text) {
      console.log(`Diacritical marks found, normalized: "${normalizedText}"`);
    }

    // Step 2: Check for help keywords in multiple languages
    const lowerCaseText = text.toLowerCase();
    const helpKeywords = [
      // English help keywords
      "help",
      "support",
      "assistance",
      "question",
      "issue",
      // Hindi help keywords (Devanagari)
      "मदद",
      "सहायता",
      "सहारा",
      "प्रश्न",
      "समस्या",
      // Kannada help keywords (Kannada script)
      "ಸಹಾಯ",
      "ಬೆಂಬಲ",
      "ಪ್ರಶ್ನೆ",
      "ಸಮಸ್ಯೆ",
      // Hinglish help keywords (Hindi in Roman script)
      "madad",
      "sahayata",
      "sahaayata",
      "prashna",
      "samasya",
      "help karo",
      "help chahiye",
      // Kannada transliterated help keywords (Kannada in Roman script)
      "sahaya",
      "sahayata",
      "prashne",
      "samasye",
      "help madi",
      "help beku",
      "sahaaya",
      "bengaluru",
    ];

    if (helpKeywords.some((keyword) => lowerCaseText.includes(keyword))) {
      console.log(`Help keyword detected in message: "${text}"`);
      return "HELP";
    }

    // Step 3: Enhanced translation logic
    const needsTranslation =
      detectedLanguage !== "en" || hasIndicPatterns || normalizedText !== text;

    if (needsTranslation) {
      let translationAttempts = [];

      // For Kannada transliteration, try preprocessing first
      if (hasIndicPatterns) {
        const preprocessedKannada = preprocessKannadaTransliteration(text);
        if (preprocessedKannada !== text) {
          translationAttempts.push({
            text: preprocessedKannada,
            label: "preprocessed-kannada",
          });
        }
      }

      // Try original text
      translationAttempts.push({ text: text, label: "original" });

      // If has diacritics, try normalized version
      if (normalizedText !== text) {
        translationAttempts.push({ text: normalizedText, label: "normalized" });
      }

      // If detected as non-Indic but has Indic patterns, try forcing Hindi/Kannada
      if (detectedLanguage === "en" && hasIndicPatterns) {
        translationAttempts.push({
          text: text,
          label: "force-hindi",
          sourceLanguage: "hi",
        });
        translationAttempts.push({
          text: normalizedText,
          label: "force-kannada",
          sourceLanguage: "kn",
        });
      }

      let bestTranslation = null;

      for (const attempt of translationAttempts) {
        try {
          let translation;

          // If this is already preprocessed Kannada, skip Google Translate
          if (attempt.label === "preprocessed-kannada") {
            translation = attempt.text;
            console.log(
              `Using preprocessed Kannada translation: "${translation}"`
            );
          } else if (attempt.sourceLanguage) {
            // Try with specific source language
            const [result] = await translate.translate(attempt.text, {
              from: attempt.sourceLanguage,
              to: "en",
            });
            translation = result;
          } else {
            // Auto-detect source language
            const [result] = await translate.translate(attempt.text, "en");
            translation = result;
          }

          // Check if translation is meaningful (different from original or is preprocessed)
          if (
            translation.toLowerCase().trim() !==
              attempt.text.toLowerCase().trim() ||
            attempt.label === "preprocessed-kannada"
          ) {
            bestTranslation = {
              original: attempt.text,
              translated: translation,
              method: attempt.label,
              sourceLanguage: attempt.sourceLanguage || detectedLanguage,
            };
            console.log(`Successful translation (${attempt.label}):`);
            console.log(`Original: "${text}"`);
            console.log(`Processed: "${attempt.text}"`);
            console.log(`Translated: "${translation}"`);
            break; // Use first successful translation
          }
        } catch (translationError) {
          console.log(
            `Translation attempt (${attempt.label}) failed:`,
            translationError.message
          );
          continue;
        }
      }

      if (bestTranslation) {
        textToAnalyze = bestTranslation.translated;
      } else {
        console.log(`No successful translation found for: "${text}"`);
        textToAnalyze = text;
      }
    } else {
      console.log(`No translation needed for English text: "${text}"`);
    }

    // Step 4: Perform sentiment analysis on the text (English or translated)

    // First, check for contextual sentiment patterns
    const contextualSentiment = analyzeContextualSentiment(textToAnalyze);

    if (contextualSentiment) {
      console.log(
        `Contextual sentiment override: "${textToAnalyze}" -> ${contextualSentiment}`
      );
      return contextualSentiment;
    }

    // If no contextual override, proceed with Google's sentiment analysis
    const document = {
      content: textToAnalyze,
      type: "PLAIN_TEXT",
    };

    const [result] = await languageClient.analyzeSentiment({ document });
    const score = result.documentSentiment.score;

    console.log(
      `Google sentiment analysis - Score: ${score} for text: "${textToAnalyze}"`
    );

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
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
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
      myStats:
        stats.find((s) => s.senderId.equals(loggedInUserId))?.stats || {},
      theirStats:
        stats.find((s) => s.senderId.equals(otherUserId))?.stats || {},
    };
    res.status(200).json(formattedStats);
  } catch (error) {
    console.log("Error in getSentimentStats controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
