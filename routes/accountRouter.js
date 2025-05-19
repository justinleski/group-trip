const { Router } = require("express");
const accountRouter = Router();

accountRouter.get("/", (req, res) => {
	res.render("account", {
		title: "Landing Page",
		username: req.user?.username || null,
	});
});

module.exports = accountRouter;
