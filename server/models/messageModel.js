// const mongoose = require("mongoose");

// const MessageSchema = mongoose.Schema(
//   {
//     message: {
//       text: { type: String, required: true },
//     },
//     users: Array,
//     sender: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Messages", MessageSchema);

const mongoose = require("mongoose");
const User = require("../models/userModel")

const MessageSchema = mongoose.Schema(
  {
    message: {
      text: { type: String },
    },
    users: Array,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    fileUrl: { type: String },      // Đường dẫn đến file
    fileName: { type: String },     // Tên file
    fileType: { type: String },     // Loại file (ví dụ: image, pdf, etc.)
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Messages", MessageSchema);