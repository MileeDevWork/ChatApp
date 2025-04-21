const express = require("express");
const router = express.Router();
const upload = require("../middleware/fileUpload");

const { createChannel, addMemberToChannel, getChannelsByUser } = require("../controllers/channelController");
const { sendChannelMessage, getChannelMessages, } = require("../controllers/channelMessageController");
const { getChannelMembers } = require("../controllers/channelController");
const { leaveChannel } = require("../controllers/channelController");
const { getAllUsers } = require("../controllers/userController");
const { sendChannelFileMessage } = require("../controllers/channelMessageController");


// Route tạo kênh mới
router.post("/create", createChannel);

// Route thêm user vào kênh
router.post("/addmember", addMemberToChannel);

// Route lấy danh sách kênh của user
router.get("/user/:userId", getChannelsByUser);

// Gửi tin nhắn
router.post("/message", sendChannelMessage);

// Lấy tin nhắn của kênh
router.get("/messages/:channelId", getChannelMessages);

//lấy danh sách thành viên kênh
router.get("/:channelId/members", getChannelMembers);

//rời khỏi kênh
router.post("/leave", leaveChannel);

// Lấy toàn bộ user trong hệ thống
router.get("/users", getAllUsers);

// Gửi file tin nhắn
router.post("/message/file", upload.single("file"), sendChannelFileMessage);

module.exports = router;
