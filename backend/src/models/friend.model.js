import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Ensure unique friendship combinations (prevent duplicate requests)
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Helper methods
friendSchema.statics.findFriendship = function (userId1, userId2) {
  return this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 },
    ],
  });
};

friendSchema.statics.getFriends = function (userId) {
  return this.find({
    $or: [
      { requester: userId, status: "accepted" },
      { recipient: userId, status: "accepted" },
    ],
  }).populate("requester recipient", "fullName email profilePic");
};

friendSchema.statics.getPendingRequests = function (userId) {
  return this.find({
    recipient: userId,
    status: "pending",
  }).populate("requester", "fullName email profilePic");
};

const Friend = mongoose.model("Friend", friendSchema);

export default Friend;
