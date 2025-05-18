const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const pool = require("../db/pool");

renderSignInForm = (req, res) => {
	res.render("signIn", {
		title: "Sign In",
		errors: [],
		enteredUserName: "",
	});
};

module.exports = {
	renderSignInForm,
};
