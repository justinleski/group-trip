const { Router } = require("express");
const signUpRouter = Router();
const {
	renderSignupForm,
	validateUser,
	handleSignUp,
} = require("../controllers/signUpController");

// GET form
signUpRouter.get("/", renderSignupForm);

// POST signup (with validation middleware + controller)
signUpRouter.post("/", validateUser, handleSignUp);

module.exports = signUpRouter;
