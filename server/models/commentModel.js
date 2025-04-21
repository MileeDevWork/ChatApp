// server/models/commentModel.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  streamerId: String, // Socket ID of the streamer
  channelId: String, // Channel ID (e.g., "main")
  username: String, // Username of the commenter
  comment: String, // Comment text
  timestamp: { type: Date, default: Date.now }, // Creation time
});

module.exports = mongoose.model("Comment", commentSchema);
