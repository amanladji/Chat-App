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
import Friend from "../models/friend.model.js";
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

    // Food/daily life questions
    /\b(what did you eat|what you ate|what u ate|did you eat|have you eaten)\b/i,
    /\b(what are you eating|what r u eating|whatcha eating)\b/i,
    /\b(where did you go|where you went|where u went|did you go)\b/i,
    /\b(what did you do|what you did|what u did|did you do)\b/i,
    /\b(how was your day|how was ur day|good day)\b/i,
    /\b(what time|when did you|have you done|did you finish)\b/i,

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

    // SPECIFIC FIXES for the mentioned cases:

    // 1. Professional/formal notifications should be neutral
    /\b(students|kindly|pay|fees|installment|registration|please|as soon as possible)\b/i,
    /\b(notice|announcement|reminder|deadline|payment|submission)\b/i,

    // 2. Future commitments/promises should be neutral
    /\b(i'll check|will check|i'll do|will do|after lunch|after work|later|tomorrow)\b/i,
    /\b(okay.*(check|do|finish|complete).*after)\b/i,

    // 5. Empathetic responses should be neutral/supportive
    /\b(oh no.*sorry|really sorry|so sorry.*hear)\b/i,
    /\b(sorry to hear|feel bad|sympathize|condolences)\b/i,
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

    // SPECIFIC FIXES for the mentioned cases:

    // 4. Frustrated/annoyed responses should be negative
    /\b(fine!.*busy.*stop.*big deal)\b/i,
    /\b(fine!.*said.*busy|stop making.*big deal)\b/i,
    /\b(i said i was busy|stop making it|big deal)\b/i,
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

// Function to detect gibberish or nonsensical text
function isGibberishText(text) {
  const cleanText = text.toLowerCase().replace(/[^a-z]/g, "");

  // If text is too short, not considered gibberish
  if (cleanText.length < 4) return false;

  // Check for patterns that indicate gibberish
  const gibberishPatterns = [
    // Random consonant clusters
    /[bcdfghjklmnpqrstvwxyz]{4,}/i,
    // Lack of vowels in longer strings
    /^[bcdfghjklmnpqrstvwxyz]{6,}$/i,
    // Random character sequences
    /^[qwrtyuiopasdfghjklzxcvbnm]{8,}$/i,
  ];

  // Check vowel ratio - normal English has roughly 40% vowels
  const vowels = (cleanText.match(/[aeiou]/g) || []).length;
  const vowelRatio = vowels / cleanText.length;

  // If very few vowels, likely gibberish
  if (cleanText.length > 5 && vowelRatio < 0.2) {
    console.log(
      `Gibberish detected - low vowel ratio: ${vowelRatio} for "${text}"`
    );
    return true;
  }

  // Check for gibberish patterns
  for (const pattern of gibberishPatterns) {
    if (pattern.test(cleanText)) {
      console.log(
        `Gibberish pattern detected: "${text}" - Pattern: ${pattern.source}`
      );
      return true;
    }
  }

  // Check for repeated characters (like "aaaaa" or "hahaha" - but allow some repetition)
  if (/(.)\1{4,}/.test(cleanText)) {
    console.log(`Excessive repetition detected: "${text}"`);
    return true;
  }

  return false;
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

    // Step 2: Enhanced translation logic
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

    // Step 3: Perform sentiment analysis on the text (English or translated)

    // First, check if the text is gibberish
    if (isGibberishText(textToAnalyze)) {
      console.log(
        `Gibberish text detected: "${textToAnalyze}" - returning NEUTRAL`
      );
      return "NEUTRAL";
    }

    // Second, check for contextual sentiment patterns
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

    // Adjusted thresholds for better accuracy based on observed patterns
    // More conservative thresholds to reduce false positives/negatives
    if (score >= 0.3) return "POSITIVE"; // Increased from 0.2 to 0.3
    if (score <= -0.3) return "NEGATIVE"; // Decreased from -0.2 to -0.3

    // Handle edge cases in the neutral zone more carefully
    if (score > 0.1 && score < 0.3) {
      // Slightly positive but not clearly positive - check for specific patterns
      if (
        /\b(okay|fine|sure|alright)\b/i.test(textToAnalyze) &&
        !/\b(great|good|nice|happy|excellent)\b/i.test(textToAnalyze)
      ) {
        console.log(
          `Borderline positive treated as NEUTRAL: "${textToAnalyze}"`
        );
        return "NEUTRAL";
      }
    }

    if (score < -0.1 && score > -0.3) {
      // Slightly negative but not clearly negative - check for empathy/concern
      if (
        /\b(sorry|oh no|concerned|worried)\b/i.test(textToAnalyze) &&
        !/\b(angry|hate|terrible|awful)\b/i.test(textToAnalyze)
      ) {
        console.log(
          `Empathetic response treated as NEUTRAL: "${textToAnalyze}"`
        );
        return "NEUTRAL";
      }
    }

    return "NEUTRAL";
  } catch (error) {
    console.error("Error analyzing sentiment:", error.message);
    return null;
  }
}

export const getUsersForSidebar = async (req, res) => {
  // ... (updated to show only friends)
  try {
    const loggedInUserId = req.user._id;

    // Get friends list instead of all users
    const friends = await Friend.getFriends(loggedInUserId);

    // Extract friend details (the other user in each friendship)
    const friendsList = friends.map((friendship) => {
      if (friendship.requester._id.equals(loggedInUserId)) {
        return friendship.recipient;
      } else {
        return friendship.requester;
      }
    });

    res.status(200).json(friendsList);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  // ... (updated to handle new deletion system)
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Find messages between the two users, excluding:
    // 1. Messages deleted for everyone
    // 2. Messages deleted for me by current user
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedForEveryone: false, // Exclude messages deleted for everyone
      deletedForMe: { $ne: myId }, // Exclude messages deleted for me by current user
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

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteType = "forMe" } = req.body; // 'forMe' or 'forEveryone'
    const userId = req.user._id;

    // Find the message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if message is already deleted for everyone
    if (message.deletedForEveryone) {
      return res
        .status(400)
        .json({ error: "Message has already been deleted for everyone" });
    }

    // Check if user is authorized to see this message (must be sender or receiver)
    const isSender = message.senderId.equals(userId);
    const isReceiver = message.receiverId.equals(userId);

    if (!isSender && !isReceiver) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this message" });
    }

    let updateResult;
    let responseMessage;

    if (deleteType === "forEveryone") {
      // Delete for everyone - only sender can do this
      if (!isSender) {
        return res.status(403).json({
          error: "Only the sender can delete a message for everyone",
        });
      }

      // Delete for everyone
      updateResult = await Message.findByIdAndUpdate(
        messageId,
        {
          deletedForEveryone: true,
          deletedBy: userId,
        },
        { new: true }
      );
      responseMessage = "Message deleted for everyone";

      // Emit to both users - message should disappear for everyone
      const senderSocketId = getReceiverSocketId(message.senderId);
      const receiverSocketId = getReceiverSocketId(message.receiverId);

      const deletionData = {
        messageId,
        deleteType: "forEveryone",
        deletedBy: userId,
        deletedForEveryone: true,
        timestamp: new Date(),
      };

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDeleted", deletionData);
      }
      if (receiverSocketId && receiverSocketId !== senderSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", deletionData);
      }
    } else {
      // Delete for me only
      // Check if user has already deleted this message for themselves
      if (message.deletedForMe && message.deletedForMe.includes(userId)) {
        return res
          .status(400)
          .json({ error: "Message already deleted for you" });
      }

      // Add user to deletedForMe array
      updateResult = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { deletedForMe: userId } },
        { new: true }
      );
      responseMessage = "Message deleted for you";

      // Only emit to the user who deleted it - message should only disappear for them
      const userSocketId = getReceiverSocketId(userId);

      const deletionData = {
        messageId,
        deleteType: "forMe",
        deletedBy: userId,
        deletedForEveryone: false,
        timestamp: new Date(),
      };

      if (userSocketId) {
        io.to(userSocketId).emit("messageDeleted", deletionData);
      }
    }

    res.status(200).json({
      message: responseMessage,
      messageId,
      deleteType,
      deletedBy: userId,
      deletedForEveryone: deleteType === "forEveryone",
    });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Bulk delete messages
export const deleteMessages = async (req, res) => {
  try {
    const { messageIds, deleteType = "forMe" } = req.body; // 'forMe' or 'forEveryone'
    const userId = req.user._id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "Message IDs array is required" });
    }

    // Find all messages to delete
    const messages = await Message.find({
      _id: { $in: messageIds },
      deletedForEveryone: false, // Exclude messages already deleted for everyone
    });

    if (messages.length === 0) {
      return res.status(404).json({
        error: "No messages found or all messages already deleted for everyone",
      });
    }

    // Check authorization for each message
    const unauthorizedMessages = messages.filter((message) => {
      const isSender = message.senderId.equals(userId);
      const isReceiver = message.receiverId.equals(userId);
      return !isSender && !isReceiver;
    });

    if (unauthorizedMessages.length > 0) {
      return res.status(403).json({
        error: "Not authorized to delete some messages",
        unauthorizedCount: unauthorizedMessages.length,
      });
    }

    let updateResult;
    let responseMessage;
    let processedMessageIds = [];

    if (deleteType === "forEveryone") {
      // Delete for everyone - only sender can do this for their own messages
      const senderMessages = messages.filter((message) =>
        message.senderId.equals(userId)
      );
      const nonSenderMessages = messages.filter(
        (message) => !message.senderId.equals(userId)
      );

      if (nonSenderMessages.length > 0) {
        return res.status(403).json({
          error: "You can only delete your own messages for everyone",
          nonSenderCount: nonSenderMessages.length,
        });
      }

      // Bulk update to delete for everyone
      const validMessageIds = senderMessages.map((msg) => msg._id);
      updateResult = await Message.updateMany(
        { _id: { $in: validMessageIds } },
        {
          deletedForEveryone: true,
          deletedBy: userId,
        }
      );
      processedMessageIds = validMessageIds;
      responseMessage = "Messages deleted for everyone";

      // Emit to all involved users - messages should disappear for everyone
      const involvedUserIds = new Set();
      senderMessages.forEach((message) => {
        involvedUserIds.add(message.senderId.toString());
        involvedUserIds.add(message.receiverId.toString());
      });

      const deletionData = processedMessageIds.map((messageId) => ({
        messageId,
        deleteType: "forEveryone",
        deletedBy: userId,
        deletedForEveryone: true,
        timestamp: new Date(),
      }));

      involvedUserIds.forEach((userId) => {
        const socketId = getReceiverSocketId(userId);
        if (socketId) {
          deletionData.forEach((data) => {
            io.to(socketId).emit("messageDeleted", data);
          });
        }
      });
    } else {
      // Delete for me only
      // Check for already deleted messages for this user
      const alreadyDeletedForMe = messages.filter(
        (message) =>
          message.deletedForMe && message.deletedForMe.includes(userId)
      );

      if (alreadyDeletedForMe.length > 0) {
        return res.status(400).json({
          error: "Some messages are already deleted for you",
          alreadyDeletedCount: alreadyDeletedForMe.length,
        });
      }

      // Bulk update to add user to deletedForMe array for all messages
      const validMessageIds = messages.map((msg) => msg._id);
      updateResult = await Message.updateMany(
        { _id: { $in: validMessageIds } },
        { $addToSet: { deletedForMe: userId } }
      );
      processedMessageIds = validMessageIds;
      responseMessage = "Messages deleted for you";

      // Only emit to the user who deleted them - messages should only disappear for them
      const userSocketId = getReceiverSocketId(userId);

      const deletionData = processedMessageIds.map((messageId) => ({
        messageId,
        deleteType: "forMe",
        deletedBy: userId,
        deletedForEveryone: false,
        timestamp: new Date(),
      }));

      if (userSocketId) {
        deletionData.forEach((data) => {
          io.to(userSocketId).emit("messageDeleted", data);
        });
      }
    }

    res.status(200).json({
      message: responseMessage,
      deletedCount: updateResult.modifiedCount,
      messageIds: processedMessageIds,
      deleteType,
      deletedBy: userId,
      deletedForEveryone: deleteType === "forEveryone",
    });
  } catch (error) {
    console.log("Error in deleteMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
