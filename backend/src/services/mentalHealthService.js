import Message from "../models/message.model.js";
import MentalHealthTracking from "../models/mentalHealthTracking.model.js";

// Service for analyzing sentiment patterns and providing mental health support
class MentalHealthService {
  constructor() {
    this.supportiveMessages = {
      encouragement: [
        "It's okay to not be okay right now. Your feelings are completely valid. 💙",
        "Be gentle with yourself today. You're doing the best you can. 🤗",
        "Some days are harder than others, and that's perfectly normal. 🌙",
        "Your heart is heavy right now, but it won't always feel this way. 💫",
        "Take it one moment at a time. There's no rush to feel better instantly. 🕊️",
        "You deserve the same kindness you show others. Be compassionate with yourself. 🌸",
        "Rest if you need to. Healing isn't always about pushing through. 🛋️",
      ],

      suggestion: [
        "Consider speaking with a therapist or counselor. They have tools that can really help. 🧠",
        "Your primary care doctor can also help connect you with mental health resources. 🏥",
        "Many employers offer Employee Assistance Programs with free counseling. Check if yours does. 💼",
        "Online therapy platforms make professional help more accessible than ever. 💻",
        "Support groups help you connect with others who understand what you're going through. 👥",
        "Mental health professionals are trained to help with exactly what you're experiencing. 🎓",
        "Taking medication for mental health is as normal as taking it for physical health. 💊",
      ],

      support: [
        "If you're having thoughts of self-harm, please reach out for help immediately. You matter. ❤️",
        "KIRAN Mental Health Helpline: 1800-599-0019 - available 24/7 for mental health support in India. 🆘",
        "Vandrevala Foundation Helpline: 1860-2662-345 or 1800-2333-330 - free 24x7 crisis support. 📞",
        "Sneha India Helpline: 044-24640050 - 24 hours emotional support and suicide prevention. 💙",
        "Remember: asking for help is a sign of strength, not weakness. 💪",
        "There are people who care about you and want to help. You don't have to face this alone. 🤝",
        "Your life has value and meaning. Even in dark moments, there is hope for brighter days. 🌅",
        "Professional counselors and therapists are trained to help with exactly what you're experiencing. 🩺",
        "Mental health helplines in India provide immediate support when you need someone to talk to. 📱",
      ],
    };
  }

  // Analyze sentiment patterns for a user to detect concerning trends
  async analyzeSentimentPattern(userId) {
    try {
      // Get user's mental health tracking record
      let tracking = await MentalHealthTracking.findOne({ userId });

      if (!tracking) {
        // Create new tracking record if it doesn't exist
        tracking = await MentalHealthTracking.create({
          userId,
          sentimentHistory: [],
          lastAnalysis: new Date(),
          status: "normal",
          settings: {
            companionEnabled: true,
            notificationFrequency: "frequent",
          },
        });
      }

      // Check if user has companion disabled
      if (!tracking.settings.companionEnabled) {
        return { shouldTrigger: false, reason: "disabled" };
      }

      // Check cooldown period (don't trigger too frequently)
      const lastTrigger = tracking.lastCompanionTrigger;

      // Get cooldown hours based on user's notification frequency preference
      let cooldownHours;
      switch (tracking.settings.notificationFrequency) {
        case "minimal":
          cooldownHours = 12; // 12 hours
          break;
        case "moderate":
          cooldownHours = 3; // 3 hours
          break;
        case "frequent":
        default:
          cooldownHours = 0.167; // 10 minutes (10/60 = 0.167 hours)
      }

      if (
        lastTrigger &&
        new Date() - lastTrigger < cooldownHours * 60 * 60 * 1000
      ) {
        const timeRemaining = Math.ceil(
          (cooldownHours * 60 * 60 * 1000 - (new Date() - lastTrigger)) /
            (1000 * 60)
        );
        console.log(
          `🧠 Mental health companion in cooldown. ${timeRemaining} minutes remaining.`
        );
        return {
          shouldTrigger: false,
          reason: "cooldown",
          minutesRemaining: timeRemaining,
        };
      }

      // Get recent messages from the user (last 15 messages in past 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentMessages = await Message.find({
        senderId: userId,
        sentiment: { $ne: null },
        createdAt: { $gte: twentyFourHoursAgo },
      })
        .sort({ createdAt: -1 })
        .limit(15);

      if (recentMessages.length < 5) {
        return { shouldTrigger: false, reason: "insufficient_data" };
      }

      const sentiments = recentMessages.map((msg) => msg.sentiment);

      // Pattern 1: Check for consecutive negative messages FROM THE MOST RECENT
      // Since messages are sorted newest first, we need to check from the beginning of the array
      let consecutiveNegative = 0;
      let maxConsecutive = 0;

      // Count consecutive negative messages starting from the most recent
      for (let i = 0; i < sentiments.length; i++) {
        if (sentiments[i] === "NEGATIVE") {
          consecutiveNegative++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveNegative);
        } else {
          // Stop counting when we hit a non-negative message
          // But continue to find the longest streak in the entire array
          consecutiveNegative = 0;
        }
      }

      // Also check for consecutive negative messages from the start (most recent messages)
      let recentConsecutive = 0;
      for (let i = 0; i < sentiments.length; i++) {
        if (sentiments[i] === "NEGATIVE") {
          recentConsecutive++;
        } else {
          break; // Stop at first non-negative message
        }
      }

      // Use the higher of the two consecutive counts
      const finalConsecutive = Math.max(maxConsecutive, recentConsecutive);

      console.log(`🧠 Sentiment analysis for user ${userId}:`, {
        totalMessages: sentiments.length,
        sentiments: sentiments,
        maxConsecutiveInArray: maxConsecutive,
        recentConsecutiveFromStart: recentConsecutive,
        finalConsecutiveCount: finalConsecutive,
      });

      // Pattern 2: Check overall negative sentiment percentage
      const negativeCount = sentiments.filter((s) => s === "NEGATIVE").length;
      const negativePercentage = (negativeCount / sentiments.length) * 100;

      // Pattern 3: Check for sudden spike in negative sentiment
      const recentFive = sentiments.slice(0, 5);
      const recentNegativeCount = recentFive.filter(
        (s) => s === "NEGATIVE"
      ).length;
      const recentNegativePercentage =
        (recentNegativeCount / recentFive.length) * 100;

      // Determine if we should trigger companion
      const shouldTrigger =
        finalConsecutive >= 7 || // 7+ consecutive negative messages (using corrected count)
        negativePercentage >= 80 || // 80%+ negative in recent messages (increased from 75)
        recentNegativePercentage >= 95; // 95%+ negative in last 5 messages (increased from 90)

      console.log(`🧠 Trigger evaluation for user ${userId}:`, {
        finalConsecutive,
        negativePercentage,
        recentNegativePercentage,
        shouldTrigger,
        triggerReason:
          finalConsecutive >= 7
            ? "consecutive_negative"
            : negativePercentage >= 80
            ? "overall_negative"
            : recentNegativePercentage >= 95
            ? "recent_spike"
            : "none",
      });

      if (shouldTrigger) {
        // Update tracking record
        tracking.lastCompanionTrigger = new Date();
        tracking.companionTriggerCount =
          (tracking.companionTriggerCount || 0) + 1;

        // Add to sentiment history
        tracking.sentimentHistory.push({
          date: new Date(),
          negativePercentage,
          consecutiveNegative: finalConsecutive,
          triggerReason: this.determineTriggerReason(
            finalConsecutive,
            negativePercentage,
            recentNegativePercentage
          ),
        });

        // Keep only last 30 entries
        if (tracking.sentimentHistory.length > 30) {
          tracking.sentimentHistory = tracking.sentimentHistory.slice(-30);
        }

        await tracking.save();

        return {
          shouldTrigger: true,
          analysis: {
            consecutiveNegative: finalConsecutive,
            negativePercentage,
            recentNegativePercentage,
            messageCount: sentiments.length,
          },
        };
      }

      return { shouldTrigger: false, reason: "patterns_not_detected" };
    } catch (error) {
      console.error("Error analyzing sentiment pattern:", error);
      return { shouldTrigger: false, reason: "error" };
    }
  }

  // Determine the primary reason for triggering
  determineTriggerReason(consecutive, overall, recent) {
    if (consecutive >= 7) return "consecutive_negative";
    if (recent >= 95) return "recent_spike";
    if (overall >= 80) return "overall_negative";
    return "multiple_factors";
  }

  // Get appropriate supportive message based on the pattern
  getSupportiveMessage(analysis = {}) {
    const { consecutiveNegative = 0, negativePercentage = 0 } = analysis;

    // Determine message type based on severity (updated thresholds)
    let messageType;
    if (consecutiveNegative >= 9 || negativePercentage >= 90) {
      messageType = "support"; // Most serious - suggest professional help
    } else if (consecutiveNegative >= 7 || negativePercentage >= 80) {
      messageType = "suggestion"; // Moderate - suggest coping strategies
    } else {
      messageType = "encouragement"; // Mild - general encouragement
    }

    const messages = this.supportiveMessages[messageType];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    return {
      message: randomMessage,
      type: messageType,
      timestamp: new Date(),
    };
  }

  // Get user's mental health settings
  async getUserSettings(userId) {
    try {
      const tracking = await MentalHealthTracking.findOne({ userId });
      return (
        tracking?.settings || {
          companionEnabled: true,
          notificationFrequency: "frequent",
        }
      );
    } catch (error) {
      console.error("Error getting user settings:", error);
      return {
        companionEnabled: true,
        notificationFrequency: "moderate",
      };
    }
  }

  // Update user's mental health settings
  async updateUserSettings(userId, settings) {
    try {
      let tracking = await MentalHealthTracking.findOne({ userId });

      if (!tracking) {
        tracking = await MentalHealthTracking.create({
          userId,
          sentimentHistory: [],
          lastAnalysis: new Date(),
          status: "normal",
          settings: {
            companionEnabled: true,
            notificationFrequency: "frequent",
            ...settings,
          },
        });
      } else {
        tracking.settings = { ...tracking.settings, ...settings };
        await tracking.save();
      }

      return tracking.settings;
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  }

  // Get user's mental health statistics
  async getUserStats(userId) {
    try {
      const tracking = await MentalHealthTracking.findOne({ userId });

      if (!tracking) {
        return {
          companionTriggerCount: 0,
          lastTrigger: null,
          status: "normal",
          historyCount: 0,
        };
      }

      return {
        companionTriggerCount: tracking.companionTriggerCount || 0,
        lastTrigger: tracking.lastCompanionTrigger,
        status: tracking.status,
        historyCount: tracking.sentimentHistory.length,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return {
        companionTriggerCount: 0,
        lastTrigger: null,
        status: "unknown",
        historyCount: 0,
      };
    }
  }

  // Reset cooldown for testing purposes
  async resetCooldown(userId) {
    try {
      const tracking = await MentalHealthTracking.findOne({ userId });
      if (tracking) {
        tracking.lastCompanionTrigger = null;
        await tracking.save();
        console.log(`🧠 Cooldown reset for user: ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error resetting cooldown:", error);
      return false;
    }
  }

  // Force trigger companion for testing
  async forceTestTrigger(userId) {
    try {
      const companionResponse = this.getSupportiveMessage({
        consecutiveNegative: 7,
        negativePercentage: 80,
      });
      return companionResponse;
    } catch (error) {
      console.error("Error forcing test trigger:", error);
      return null;
    }
  }
}

export default new MentalHealthService();
