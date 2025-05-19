const { Router } = require("express");
const signOutRouter = Router();

signOutRouter.get("/", (req, res, next) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		} else {
			res.redirect("/");
		}
	});
});

module.exports = signOutRouter;
