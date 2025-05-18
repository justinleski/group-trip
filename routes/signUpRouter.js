const { Router } = require("express");
const signUpRouter = Router();

signUpRouter.get("/", (req, res) => {
    res.render("signUp", { title: "Sign Up" })
});

module.exports = signUpRouter;