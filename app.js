const express = require("express");
const path = require("node:path");
const app = express();

// routers
const indexRouter = require("./routes/indexRouter");
const signUpRouter = require("./routes/signUpRouter");
const signInRouter = require("./routes/signInRouter");

app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/", indexRouter);
app.use("/sign-up", signUpRouter);
app.use("/sign-in", signInRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`GroupTrip - listening on port ${PORT}!`);
});
