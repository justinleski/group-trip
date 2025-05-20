const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const pool = require("../db/pool");

renderSignupForm = (req, res) => {
	res.render("signUp", {
		title: "Sign Up",
		errors: [],
		enteredUserName: "",
	});
};

// validators inside controller
const alphaErr = "must only contain letters.";
const lengthErr = "must be between 5 and 20 characters.";

const validateUser = [
	body("username")
		.trim()
		.isAlpha()
		.withMessage(`Username ${alphaErr}`)
		.isLength({ min: 5, max: 20 })
		.withMessage(`Username ${lengthErr}`),
	body("password").trim().isLength({ min: 5, max: 10 }).withMessage(`Password ${lengthErr}`),
	body("confirm-password").custom((value, { req }) => {
		if (value !== req.body.password) {
			throw new Error("Passwords do not match.");
		}
		return true;
	}),
];

handleSignUp = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		// console.log(errors);

		return res.status(400).render("signUp", {
			title: "Sign Up",
			errors: errors.array(),
			enteredUserName: req.body.username,
		});
	}

	const username = req.body.username.toLowerCase();

	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		const result = await pool.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", [
			username, // esnure lower case for sake of uniqueness
			hashedPassword,
		]);

		// TODO: redirect somewhere - auto login and take to account for now FIXME: should be home page once ready
		const newUserId = result.rows[0].id;
		req.login({ id: newUserId, username }, (err) => {
			if (err) return next(err);
			return res.redirect("/trip-overview");
		});
	} catch (err) {
		// PSQL uses error code 23505 to catch unique constraint viols so it will mean that user tried to enter username in use
		if (err.code === "23505") {
			return res.status(400).render("signUp", {
				title: "Sign Up",
				errors: [{ msg: "This username is already in use." }],
				enteredUserName: username,
			});
		}

		console.log("Error signing up");
		return next(err);
	}
};

// export fuinction to be sued by rest of Node
module.exports = {
	renderSignupForm,
	handleSignUp,
	validateUser,
};
