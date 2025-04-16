const { addMessage, getMessages } = require("../controllers/messageController");
const router = require("express").Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);

router.post("/addmsg", async (req, res, next) => {
    try {
      const { message, sender, groupId } = req.body;
      const data = await Messages.create({
        message: message,
        sender: sender,
        groupId: groupId || null,
      });
      if (data) return res.json({ msg: "Message added successfully." });
      return res.json({ msg: "Failed to add message to the database" });
    } catch (ex) {
      next(ex);
    }
  });

module.exports = router;
