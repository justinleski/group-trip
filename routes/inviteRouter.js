const express = require("express");
const router = express.Router();
const inviteController = require("../controllers/inviteController");

router.post("/:tripId/create", inviteController.createInvite);
router.get("/:token", inviteController.acceptInvite);

module.exports = router;
