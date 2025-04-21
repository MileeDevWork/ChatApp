const { addMessage, getMessages, addFileMessage } = require("../controllers/messageController");
const upload = require("../middleware/fileUpload");
const router = require("express").Router();

router.post("/addmsg", addMessage);
router.post("/getmsg", getMessages);
router.post("/addfilemsg", upload.single("file"), addFileMessage);

module.exports = router;