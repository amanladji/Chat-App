import mongoose from "mongoose";

const mentalHealthTrackingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    sentimentHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        negativePercentage: Number,
        consecutiveNegative: Number,
        triggerReason: String,
      },
    ],
    lastAnalysis: {
      type: Date,
      default: Date.now,
    },
    lastCompanionTrigger: {
      type: Date,
      default: null,
    },
    companionTriggerCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["normal", "concerning", "critical"],
      default: "normal",
    },
    settings: {
      companionEnabled: {
        type: Boolean,
        default: true,
      },
      notificationFrequency: {
        type: String,
        enum: ["frequent", "moderate", "minimal"],
        default: "frequent",
      },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
mentalHealthTrackingSchema.index({ userId: 1 });
mentalHealthTrackingSchema.index({ lastCompanionTrigger: 1 });

const MentalHealthTracking = mongoose.model(
  "MentalHealthTracking",
  mentalHealthTrackingSchema
);

export default MentalHealthTracking;
