const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users", // Liên kết với model User
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Channels", channelSchema);
