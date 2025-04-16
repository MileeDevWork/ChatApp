const express = require("express");
const router = express.Router();
const { createChannel, addMemberToChannel } = require("../controllers/channelController");

// Route tạo kênh mới
router.post("/create", createChannel);

// Route thêm user vào kênh
router.post("/addmember", addMemberToChannel);

module.exports = router;
