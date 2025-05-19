const { Router } = require("express");
const signInRouter = Router();
const {
	renderSignInForm,
	handleSignIn,
} = require("../controllers/signInController");

// GET form
signInRouter.get("/", renderSignInForm);

signInRouter.post("/", handleSignIn);

module.exports = signInRouter;
