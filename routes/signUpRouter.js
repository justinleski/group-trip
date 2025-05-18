const { Router } = require("express");
const signUpRouter = Router();

signUpRouter.get("/", (req, res) => {
    res.render("signUp", { title: "Sign Up" })
});

signUpRouter.post("/", async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await pool.query("insert into users (username, password) values ($1, $2)", [req.body.username, hashedPassword]);
        res.redirect("/");
    } catch (error) {
        console.error(error);
        next(error);
    }


    // res.render("", { title: "PLACEHOLDER" })

});

module.exports = signUpRouter;