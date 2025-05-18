const { Router } = require("express");
const signUpRouter = Router();
const { renderSignInForm } = require("../controllers/signInController");

// GET form
signUpRouter.get("/", renderSignInForm);

module.exports = signUpRouter;
