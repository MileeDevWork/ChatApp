const Channel = require("../models/channelModel");
const User = require("../models/userModel");

// Tạo kênh mới
module.exports.createChannel = async (req, res, next) => {
  try {
    const { name, creator } = req.body; // Nhận tên kênh từ body

    // Kiểm tra nếu kênh đã tồn tại
    const existingChannel = await Channel.findOne({ name });
    if (existingChannel) {
      return res
        .status(400)
        .json({ msg: "Channel already exists", status: false });
    }

    // Tạo kênh mới
    const channel = new Channel({ name, creator, members: [creator] });
    const populatedChannel = await Channel.findById(channel._id).populate(
      "members",
      "username _id"
    );
    await channel.save();

    return res.status(200).json({
      msg: "Channel created successfully",
      status: true,
      channel: populatedChannel,
    });
  } catch (ex) {
    next(ex);
  }
};

// Thêm user vào kênh
module.exports.addMemberToChannel = async (req, res, next) => {
  try {
    const { channelId, userId } = req.body; // Nhận channelId và userId từ request body

    // Tìm kênh theo ID
    const channel = await Channel.findById(channelId);

    // Nếu kênh không tồn tại
    if (!channel) {
      return res.status(404).json({ msg: "Channel not found", status: false });
    }

    // Kiểm tra xem user đã có trong kênh chưa
    if (channel.members.includes(userId)) {
      return res
        .status(400)
        .json({ msg: "User already a member", status: false });
    }

    // Thêm user vào kênh
    channel.members.push(userId);
    await channel.save(); // Lưu thay đổi vào DB

    return res
      .status(200)
      .json({
        msg: "User added to channel successfully",
        status: true,
        channel,
      });
  } catch (ex) {
    next(ex);
  }
};

//lấy danh sách kênh của user
module.exports.getChannelsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const channels = await Channel.find({ members: userId }).populate(
      "members",
      "username _id"
    );

    return res.status(200).json({ status: true, channels });
  } catch (ex) {
    next(ex);
  }
};

// lấy danh sách thành viên kênh
module.exports.getChannelMembers = async (req, res, next) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ msg: "Channel not found" });
    }

    const members = await User.find(
      { _id: { $in: channel.members } },
      "_id username email"
    );

    return res.status(200).json({ members });
  } catch (err) {
    next(err);
  }
};

//rời khỏi kênh
module.exports.leaveChannel = async (req, res, next) => {
  try {
    const { channelId, userId } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ status: false, msg: "Channel not found" });
    }

    const memberIndex = channel.members.indexOf(userId);
    if (memberIndex === -1) {
      return res
        .status(400)
        .json({ status: false, msg: "User is not a member of the channel" });
    }

    // Xóa user khỏi danh sách
    channel.members.splice(memberIndex, 1);
    await channel.save();

    return res.status(200).json({
      status: true,
      msg: "User removed from channel",
      channel,
    });
  } catch (ex) {
    next(ex);
  }
};
