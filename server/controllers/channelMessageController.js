const ChannelMessage = require("../models/channelMessageModel");

// Gửi tin nhắn vào kênh
module.exports.sendChannelMessage = async (req, res, next) => {
  try {
    const { channelId, senderId, message } = req.body;

    const newMessage = await ChannelMessage.create({
      channel: channelId,
      sender: senderId,
      message,
    });

    res.status(201).json({ status: true, message: newMessage });
  } catch (err) {
    next(err);
  }
};

// Lấy tin nhắn từ kênh
module.exports.getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;

    const messages = await ChannelMessage.find({ channel: channelId })
      .populate("sender", "username") // Lấy tên người gửi
      .sort({ createdAt: 1 });

    res.status(200).json({ status: true, messages });
  } catch (err) {
    next(err);
  }
};
