const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
// const pool = require("../db/pool");
const passport = require("passport");

renderSignInForm = (req, res) => {
	res.render("signIn", {
		title: "Sign In",
		errors: [],
		enteredUserName: "",
	});
};

handleSignIn = async (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) return next(err);
		if (!user) {
			return res.render("signIn", {
				title: "Sign In",
				errors: [{ msg: info.message }],
				enteredUserName: req.body.username,
			});
		}
		req.logIn(user, (err) => {
			if (err) return next(err);
			return res.redirect("/account");
		});
	})(req, res, next);
};

module.exports = {
	renderSignInForm,
	handleSignIn,
};
