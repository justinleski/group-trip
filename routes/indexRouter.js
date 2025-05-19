const { Router } = require("express");
const indexRouter = Router();

indexRouter.get("/", (req, res) => {
	// check if user is signed in via passport.js so we can determine if we go to sign up page or account view
	res.render("index", { title: "Landing Page", user: req.user });
});

module.exports = indexRouter;
