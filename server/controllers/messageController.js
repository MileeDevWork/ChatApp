const Messages = require("../models/messageModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileType: msg.fileType,
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};

module.exports.addFileMessage = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ status: false, msg: "No file uploaded" });
    }

    const fileUrl = `http://localhost:5001/uploads/${file.filename}`;

    const newMessage = await Messages.create({
      users: [from, to],
      sender: from,
      fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
    });

    await newMessage.populate("sender", "username");

    res.status(200).json({ status: true, message: newMessage });
  } catch (err) {
    next(err);
  }
};